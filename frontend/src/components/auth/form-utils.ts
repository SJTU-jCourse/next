export function fieldError(errors: unknown[]) {
  return errors.length > 0 ? String(errors[0]) : null
}

export function fieldA11yProps(id: string, error: string | null | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const
}
