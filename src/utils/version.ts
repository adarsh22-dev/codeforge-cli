let _version: string = '0.0.0'

export function getVersion(): string {
  return _version
}

export function setVersion(v: string): void {
  _version = v
}
