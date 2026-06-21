export function generateId(): string {
  return crypto.randomUUID()
}

export function shortId(): string {
  return generateId().split('-')[0]
}
