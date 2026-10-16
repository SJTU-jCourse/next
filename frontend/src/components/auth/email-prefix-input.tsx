import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { defaultAuthEmailDomain, normalizeAuthEmailPrefix } from "@/config/auth"

interface EmailPrefixInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  autoComplete?: string
  placeholder?: string
  emailDomain?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

export function EmailPrefixInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  autoComplete = "username",
  placeholder = "your",
  emailDomain = defaultAuthEmailDomain,
  ...ariaProps
}: EmailPrefixInputProps) {
  const suffixID = `${id}-domain`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex">
        <Input
          id={id}
          type="text"
          inputMode="email"
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onChange(normalizeAuthEmailPrefix(e.target.value, emailDomain))
          }
          onBlur={onBlur}
          autoComplete={autoComplete}
          className="rounded-r-none"
          aria-invalid={ariaProps["aria-invalid"]}
          aria-describedby={[suffixID, ariaProps["aria-describedby"]]
            .filter(Boolean)
            .join(" ")}
        />
        <span
          id={suffixID}
          className="inline-flex h-9 shrink-0 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground"
        >
          {emailDomain}
        </span>
      </div>
    </div>
  )
}
