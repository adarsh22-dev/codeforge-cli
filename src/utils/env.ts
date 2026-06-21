export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] ?? defaultValue
}

export function getEnvVarOrThrow(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

export function getEnvBool(name: string): boolean {
  return process.env[name] === '1' || process.env[name]?.toLowerCase() === 'true'
}
