import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  clearAdminUserSuspension,
  getAdminUserByEmail,
  grantAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  revokeAdminUser,
  suspendAdminUser,
  type ResetAdminUserPasswordCommand,
  type SuspendAdminUserCommand,
} from "@/api/admin-user"

type SuspendAdminUserVariables = {
  userID: number
  cmd: SuspendAdminUserCommand
}

type ResetAdminUserPasswordVariables = {
  userID: number
  cmd: ResetAdminUserPasswordCommand
}

export function useAdminUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase()

  return useQuery({
    queryKey: ["admin-user", "by-email", normalized],
    queryFn: () => getAdminUserByEmail(normalized),
    enabled: normalized.length > 0,
    retry: false,
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-user", "admins"],
    queryFn: listAdminUsers,
  })
}

export function useSuspendAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userID, cmd }: SuspendAdminUserVariables) =>
      suspendAdminUser(userID, cmd),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-user"] })
    },
  })
}

export function useClearAdminUserSuspension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearAdminUserSuspension,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-user"] })
    },
  })
}

export function useGrantAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: grantAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-user"] })
    },
  })
}

export function useRevokeAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-user"] })
    },
  })
}

export function useResetAdminUserPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userID, cmd }: ResetAdminUserPasswordVariables) =>
      resetAdminUserPassword(userID, cmd),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-user"] })
    },
  })
}
