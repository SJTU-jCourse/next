package application_test

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"jcourse/internal/application"
	"jcourse/internal/domain/account"
	"jcourse/internal/domain/account/credential"
	"jcourse/internal/domain/account/identity"
	"jcourse/internal/domain/account/security"
	"jcourse/internal/domain/account/verification"
	"jcourse/internal/domain/auth"
	domainemail "jcourse/internal/domain/email"
	"jcourse/internal/domain/task"
)

func TestAccountCommandService_SendRegisterCode(t *testing.T) {
	accountRepo := newFakeAccountRepo(nil)
	userRepo := newFakeAuthUserRepo(nil)
	enqueuer := &fakeEnqueuer{}
	oldEnqueuer := task.SetEnqueuerForTest(enqueuer)
	t.Cleanup(func() { task.SetEnqueuer(oldEnqueuer) })
	svc := newAccountService(accountRepo, userRepo, newFakeCodeRepo())

	err := svc.SendRegisterCode(context.Background(), application.SendRegisterCodeCommand{Email: "alice@example.edu"})
	if err != nil {
		t.Fatalf("SendRegisterCode: %v", err)
	}
	assertVerificationEmailTask(t, enqueuer.tasks[0], "alice@example.edu")

	err = svc.SendRegisterCode(context.Background(), application.SendRegisterCodeCommand{Email: "alice@example.edu"})
	if !errors.Is(err, verification.ErrSendTooSoon) {
		t.Fatalf("second SendRegisterCode error = %v, want ErrVerificationTooSoon", err)
	}
}

func TestAccountCommandService_SendRegisterCodeRejectsEmailOutsideWhitelist(t *testing.T) {
	svc := newAccountService(newFakeAccountRepo(nil), newFakeAuthUserRepo(nil), newFakeCodeRepo())

	err := svc.SendRegisterCode(context.Background(), application.SendRegisterCodeCommand{Email: "alice@example.com"})
	if !errors.Is(err, identity.ErrEmailNotAllowed) {
		t.Fatalf("SendRegisterCode error = %v, want ErrEmailNotAllowed", err)
	}
}

func TestAccountCommandService_SendRegisterCodeSendsForExistingUser(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "secret")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}})
	enqueuer := &fakeEnqueuer{}
	oldEnqueuer := task.SetEnqueuerForTest(enqueuer)
	t.Cleanup(func() { task.SetEnqueuer(oldEnqueuer) })
	svc := newAccountService(accountRepo, userRepo, newFakeCodeRepo())

	if err := svc.SendRegisterCode(context.Background(), application.SendRegisterCodeCommand{Email: "Alice@Example.EDU"}); err != nil {
		t.Fatalf("SendRegisterCode: %v", err)
	}
	assertVerificationEmailTask(t, enqueuer.tasks[0], "alice@example.edu")
}

func TestAccountCommandService_RegisterAndLogin(t *testing.T) {
	accountRepo := newFakeAccountRepo(nil)
	userRepo := newFakeAuthUserRepo(nil)
	codes := newFakeCodeRepo()
	svc := newAccountService(accountRepo, userRepo, codes)
	ctx := context.Background()

	if err := svc.SendRegisterCode(ctx, application.SendRegisterCodeCommand{Email: "alice@example.edu"}); err != nil {
		t.Fatalf("SendRegisterCode: %v", err)
	}
	registered, err := svc.Register(ctx, application.RegisterCommand{Email: "Alice@Example.EDU", Code: codes.Saved["alice@example.edu"].Code, Password: "secret"})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	if registered.ID == 0 || registered.Email != "" || registered.Role != auth.RoleUser {
		t.Fatalf("registered user = %+v", registered)
	}
	if registered.Username != accountUsername(t, "alice@example.edu") {
		t.Fatalf("registered username = %q", registered.Username)
	}

	loggedIn, err := svc.Login(ctx, application.LoginCommand{Email: "alice@example.edu", Password: "secret"})
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if loggedIn.ID != registered.ID {
		t.Fatalf("Login ID = %d, want %d", loggedIn.ID, registered.ID)
	}
}

func TestAccountCommandService_RegisterRejectsWrongCode(t *testing.T) {
	codes := newFakeCodeRepo()
	codes.Saved["alice@example.edu"] = verification.Code{Email: "alice@example.edu", Code: "123456", ExpiresAt: time.Now().Add(time.Minute)}
	svc := newAccountService(newFakeAccountRepo(nil), newFakeAuthUserRepo(nil), codes)

	_, err := svc.Register(context.Background(), application.RegisterCommand{Email: "alice@example.edu", Code: "000000", Password: "secret"})
	if !errors.Is(err, verification.ErrCodeInvalid) {
		t.Fatalf("Register error = %v, want ErrVerificationCodeInvalid", err)
	}
}

func TestAccountCommandService_RegisterRejectsExistingUserAfterCode(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "secret")},
	})
	codes := newFakeCodeRepo()
	codes.Saved["alice@example.edu"] = verification.Code{Email: "alice@example.edu", Code: "123456", ExpiresAt: time.Now().Add(time.Minute)}
	svc := newAccountService(accountRepo, newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}}), codes)

	_, err := svc.Register(context.Background(), application.RegisterCommand{Email: "alice@example.edu", Code: "123456", Password: "secret"})
	if !errors.Is(err, identity.ErrAlreadyExists) {
		t.Fatalf("Register error = %v, want ErrUserAlreadyExists", err)
	}
}

func TestAccountCommandService_LoginRejectsWrongPassword(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "secret")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}})
	svc := newAccountService(accountRepo, userRepo, newFakeCodeRepo())

	_, err := svc.Login(context.Background(), application.LoginCommand{Email: "alice@example.edu", Password: "wrong"})
	if !errors.Is(err, security.ErrInvalidCredentials) {
		t.Fatalf("Login error = %v, want ErrInvalidCredentials", err)
	}
}

func TestAccountCommandService_LoginRejectsAccountWithoutPassword(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: ""},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}})
	svc := newAccountService(accountRepo, userRepo, newFakeCodeRepo())

	_, err := svc.Login(context.Background(), application.LoginCommand{Email: "alice@example.edu", Password: "secret"})
	if !errors.Is(err, security.ErrPasswordNotSet) {
		t.Fatalf("Login error = %v, want ErrPasswordNotSet", err)
	}
}

func TestAccountCommandService_LoginRejectsSuspendedUser(t *testing.T) {
	now := time.Now()
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "secret")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser, SuspendedAt: new(now.Add(-time.Hour)), SuspendTill: new(now.Add(time.Hour))}})
	svc := newAccountService(accountRepo, userRepo, newFakeCodeRepo())

	_, err := svc.Login(context.Background(), application.LoginCommand{Email: "alice@example.edu", Password: "secret"})
	if !errors.Is(err, auth.ErrUserSuspended) {
		t.Fatalf("Login error = %v, want ErrUserSuspended", err)
	}
}

func TestAccountCommandService_LoginAllowsExpiredSuspensionAndEnqueuesCleanup(t *testing.T) {
	now := time.Now()
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "secret")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser, SuspendedAt: new(now.Add(-2 * time.Hour)), SuspendTill: new(now.Add(-time.Hour))}})
	enqueuer := &fakeEnqueuer{}
	oldEnqueuer := task.SetEnqueuerForTest(enqueuer)
	t.Cleanup(func() { task.SetEnqueuer(oldEnqueuer) })
	svc := newAccountService(accountRepo, userRepo, newFakeCodeRepo())

	loggedIn, err := svc.Login(context.Background(), application.LoginCommand{Email: "alice@example.edu", Password: "secret"})
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if loggedIn.ID != 1 {
		t.Fatalf("Login ID = %d, want 1", loggedIn.ID)
	}
	if !enqueuer.enqueued {
		t.Fatal("expected cleanup task to be enqueued")
	}
}

func TestAccountCommandService_LoginLockedAfterMaxAttempts(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "secret")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}})
	attempts := security.NewMockLoginAttemptRepository(map[string]int{"alice@example.edu": 5})
	svc := newAccountServiceWithAttempts(accountRepo, userRepo, newFakeCodeRepo(), newFakeCodeRepo(), 5, attempts)

	_, err := svc.Login(context.Background(), application.LoginCommand{Email: "alice@example.edu", Password: "secret"})
	if !errors.Is(err, security.ErrLoginLocked) {
		t.Fatalf("Login error = %v, want ErrLoginLocked", err)
	}
}

func TestAccountCommandService_SendResetCodeAndResetPassword(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "oldpass")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}})
	codes := newFakeCodeRepo()
	enqueuer := &fakeEnqueuer{}
	oldEnqueuer := task.SetEnqueuerForTest(enqueuer)
	t.Cleanup(func() { task.SetEnqueuer(oldEnqueuer) })
	svc := newAccountServiceWithAttempts(accountRepo, userRepo, newFakeCodeRepo(), codes, 5, security.NewMockLoginAttemptRepository(nil))
	ctx := context.Background()

	if err := svc.SendResetCode(ctx, application.SendResetCodeCommand{Email: "alice@example.edu"}); err != nil {
		t.Fatalf("SendResetCode: %v", err)
	}
	assertVerificationEmailTask(t, enqueuer.tasks[0], "alice@example.edu")

	if err := svc.ResetPassword(ctx, application.ResetPasswordCommand{Email: "alice@example.edu", Code: codes.Saved["alice@example.edu"].Code, NewPassword: "newpass"}); err != nil {
		t.Fatalf("ResetPassword: %v", err)
	}

	loggedIn, err := svc.Login(ctx, application.LoginCommand{Email: "alice@example.edu", Password: "newpass"})
	if err != nil {
		t.Fatalf("Login after reset: %v", err)
	}
	if loggedIn.ID != 1 {
		t.Fatalf("Login ID = %d, want 1", loggedIn.ID)
	}
}

func TestAccountCommandService_SendResetCodeSendsForUnknownEmail(t *testing.T) {
	codes := newFakeCodeRepo()
	enqueuer := &fakeEnqueuer{}
	oldEnqueuer := task.SetEnqueuerForTest(enqueuer)
	t.Cleanup(func() { task.SetEnqueuer(oldEnqueuer) })
	svc := newAccountServiceWithAttempts(newFakeAccountRepo(nil), newFakeAuthUserRepo(nil), newFakeCodeRepo(), codes, 5, security.NewMockLoginAttemptRepository(nil))

	err := svc.SendResetCode(context.Background(), application.SendResetCodeCommand{Email: "nobody@example.edu"})
	if err != nil {
		t.Fatalf("SendResetCode: %v", err)
	}
	assertVerificationEmailTask(t, enqueuer.tasks[0], "nobody@example.edu")
	if len(codes.Saved["nobody@example.edu"].Code) != 6 {
		t.Fatalf("saved code = %q, want 6 digits", codes.Saved["nobody@example.edu"].Code)
	}
}

func TestAccountCommandService_ResetPasswordRejectsWrongCode(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "oldpass")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}})
	svc := newAccountService(accountRepo, userRepo, newFakeCodeRepo())

	err := svc.ResetPassword(context.Background(), application.ResetPasswordCommand{Email: "alice@example.edu", Code: "000000", NewPassword: "newpass"})
	if !errors.Is(err, verification.ErrCodeInvalid) {
		t.Fatalf("ResetPassword error = %v, want ErrVerificationCodeInvalid", err)
	}
}

func TestAccountCommandService_LoginFailedIncrementsAndLocks(t *testing.T) {
	username := accountUsername(t, "alice@example.edu")
	accountRepo := newFakeAccountRepo(map[string]*identity.Account{
		"alice@example.edu": {ID: 1, Username: username, PasswordHash: mustHash(t, "secret")},
	})
	userRepo := newFakeAuthUserRepo(map[int]*auth.User{1: {ID: 1, Role: auth.RoleUser}})
	attempts := security.NewMockLoginAttemptRepository(map[string]int{})
	svc := newAccountServiceWithAttempts(accountRepo, userRepo, newFakeCodeRepo(), newFakeCodeRepo(), 3, attempts)
	ctx := context.Background()

	for i := 1; i <= 3; i++ {
		_, err := svc.Login(ctx, application.LoginCommand{Email: "alice@example.edu", Password: "wrong"})
		if !errors.Is(err, security.ErrInvalidCredentials) {
			t.Fatalf("attempt %d error = %v, want ErrInvalidCredentials", i, err)
		}
	}

	_, err := svc.Login(ctx, application.LoginCommand{Email: "alice@example.edu", Password: "secret"})
	if !errors.Is(err, security.ErrLoginLocked) {
		t.Fatalf("error after 3 failures = %v, want ErrLoginLocked", err)
	}
}

func newAccountService(accountRepo *identity.MockRepository, userRepo *auth.MockUserRepository, codes *verification.MockCodeRepository) *application.AccountCommandService {
	return newAccountServiceWithAttempts(accountRepo, userRepo, codes, newFakeCodeRepo(), 5, security.NewMockLoginAttemptRepository(nil))
}

func newAccountServiceWithAttempts(
	accountRepo *identity.MockRepository,
	userRepo *auth.MockUserRepository,
	registerCodes *verification.MockCodeRepository,
	resetCodes *verification.MockCodeRepository,
	maxLoginAttempts int,
	attempts security.LoginAttemptRepository,
) *application.AccountCommandService {
	accountRepo.AfterCreate = func(acct *identity.Account) {
		userRepo.Users[acct.ID] = &auth.User{ID: acct.ID, Role: auth.RoleUser}
	}
	hasher := credential.NewDjangoPBKDF2SHA256PasswordHasher(credential.PasswordHashConfig{Iterations: 1})
	usernames := testUsernameDeriver()
	return application.NewAccountCommandService(
		account.NewRegistrationService(accountRepo, registerCodes, hasher, usernames),
		account.NewLoginService(accountRepo, hasher, attempts, usernames),
		account.NewPasswordResetService(accountRepo, resetCodes, hasher, usernames),
		auth.NewCurrentUserService(userRepo),
		auth.NewSessionAuthService(accountRepo, "test-session-secret"),
		testAccountSettingsProvider(maxLoginAttempts),
	)
}

func testAccountSettingsProvider(maxLoginAttempts int) application.StaticSiteSettingsProvider {
	provider := application.NewDefaultSiteSettingsProvider()
	provider.AccountRuntime = application.AccountRuntimeConfig{
		Registration: testRegistrationConfig(),
		Login:        testLoginConfig(maxLoginAttempts),
		Verification: testVerificationConfig(),
	}
	return provider
}

func mustHash(t *testing.T, password string) string {
	t.Helper()
	hash, err := credential.NewDjangoPBKDF2SHA256PasswordHasher(credential.PasswordHashConfig{Iterations: 1}).Hash(password)
	if err != nil {
		t.Fatalf("Hash: %v", err)
	}
	return hash
}

func testRegistrationConfig() account.RegistrationConfig {
	return account.RegistrationConfig{
		EmailWhitelist: []string{"@example.edu"},
	}
}

func testVerificationConfig() verification.Config {
	return verification.Config{
		CodeInterval: time.Minute,
		CodeTTL:      10 * time.Minute,
		CodeLength:   6,
	}
}

func testLoginConfig(maxLoginAttempts int) account.LoginConfig {
	return account.LoginConfig{
		MaxAttempts: maxLoginAttempts,
		Lockout:     15 * time.Minute,
	}
}

func newFakeAccountRepo(accounts map[string]*identity.Account) *identity.MockRepository {
	if accounts == nil {
		accounts = map[string]*identity.Account{}
	}
	repo := identity.NewMockRepository(nil)
	for email, acct := range accounts {
		copy := *acct
		if copy.Username == "" {
			copy.Username = accountUsernameFromEmail(email)
		}
		repo.PutAccount(email, &copy)
	}
	return repo
}

func accountUsername(t *testing.T, email string) string {
	t.Helper()
	username, err := testUsernameDeriver().UsernameFromEmail(email)
	if err != nil {
		t.Fatalf("UsernameFromEmail: %v", err)
	}
	return username
}

func accountUsernameFromEmail(email string) string {
	username, err := testUsernameDeriver().UsernameFromEmail(email)
	if err != nil {
		return email
	}
	return username
}

func testUsernameDeriver() identity.UsernameDeriver {
	return identity.NewBLAKE2bUsernameDeriver(identity.UsernameDeriverConfig{Salt: "SALT"})
}

func newFakeAuthUserRepo(users map[int]*auth.User) *auth.MockUserRepository {
	return auth.NewMockUserRepository(users)
}

func newFakeCodeRepo() *verification.MockCodeRepository {
	return verification.NewMockCodeRepository()
}

type fakeEnqueuer struct {
	enqueued bool
	tasks    []task.Task
}

func (f *fakeEnqueuer) Enqueue(_ context.Context, taskItem task.Task, _ ...task.EnqueueOption) error {
	f.enqueued = true
	f.tasks = append(f.tasks, taskItem)
	return nil
}

func assertVerificationEmailTask(t *testing.T, taskItem task.Task, to string) {
	t.Helper()
	if taskItem == nil {
		t.Fatal("expected email task to be enqueued")
	}
	if got := taskItem.Type(); got != domainemail.TaskTypeSendEmail {
		t.Fatalf("task type = %q, want %q", got, domainemail.TaskTypeSendEmail)
	}
	var payload domainemail.SendEmailPayload
	if err := json.Unmarshal(taskItem.Payload(), &payload); err != nil {
		t.Fatalf("unmarshal email payload: %v", err)
	}
	if payload.EmailType != "verification_code" || payload.Email.To != to || payload.Email.Subject != "【SJTU选课社区】邮箱验证码" || payload.Email.Body == "" {
		t.Fatalf("email payload = %+v", payload)
	}
}
