import { useState } from "react"
import { RiSearchLine } from "@remixicon/react"
import { EmailPrefixInput } from "@/components/auth/email-prefix-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildAuthEmail, normalizeAuthEmailPrefix } from "@/config/auth"
import type { FormSubmitEvent } from "@/components/admin/admin-utils"

export interface AdminUserLookupFormValue {
  email?: string
  username?: string
  review_id?: number
}

interface AdminUserSearchFormProps {
  email: string
  username: string
  reviewID?: number
  emailDomain: string
  onSearch: (value: AdminUserLookupFormValue) => void
}

export function AdminUserSearchForm({
  email,
  username,
  reviewID,
  emailDomain,
  onSearch,
}: AdminUserSearchFormProps) {
  const [emailPrefix, setEmailPrefix] = useState(() =>
    normalizeAuthEmailPrefix(email, emailDomain)
  )
  const [usernameValue, setUsernameValue] = useState(username)
  const [reviewIDValue, setReviewIDValue] = useState(
    reviewID ? String(reviewID) : ""
  )

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()

    const nextPrefix = emailPrefix.trim()
    const nextReviewID = Number(reviewIDValue)

    onSearch({
      email: nextPrefix
        ? buildAuthEmail(nextPrefix, emailDomain).toLowerCase()
        : undefined,
      username: usernameValue.trim() || undefined,
      review_id:
        Number.isFinite(nextReviewID) && nextReviewID > 0
          ? Math.trunc(nextReviewID)
          : undefined,
    })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-72 flex-1">
          <EmailPrefixInput
            id="admin-user-email"
            label="邮箱"
            value={emailPrefix}
            emailDomain={emailDomain}
            onChange={setEmailPrefix}
            placeholder="jAccount"
          />
        </div>
        <div className="min-w-48 flex-1">
          <div className="space-y-2">
            <Label htmlFor="admin-user-username">原始用户名</Label>
            <Input
              id="admin-user-username"
              value={usernameValue}
              onChange={(event) => setUsernameValue(event.target.value)}
              placeholder="用户名"
            />
          </div>
        </div>
        <div className="min-w-32 flex-1">
          <div className="space-y-2">
            <Label htmlFor="admin-user-review-id">点评 ID</Label>
            <Input
              id="admin-user-review-id"
              type="number"
              min={1}
              value={reviewIDValue}
              onChange={(event) => setReviewIDValue(event.target.value)}
              placeholder="点评 ID"
            />
          </div>
        </div>
        <Button type="submit">
          <RiSearchLine />
          查询
        </Button>
      </div>
    </form>
  )
}
