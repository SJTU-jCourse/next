type FieldErrorTextProps = {
  id: string
  error: string | null | undefined
}

export function FieldErrorText({ id, error }: FieldErrorTextProps) {
  if (!error) return null
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {error}
    </p>
  )
}
