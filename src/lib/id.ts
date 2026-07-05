const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateId(): string {
  return crypto.randomUUID();
}

export function isValidUuid(value: string | undefined | null): value is string {
  return !!value && UUID_RE.test(value);
}

export function asUuidOrNull(value: string | undefined | null): string | null {
  return isValidUuid(value) ? value : null;
}
