export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLevel = LogLevel.INFO

export function setLogLevel(level: LogLevel): void {
  currentLevel = level
}

export function debug(...args: any[]): void {
  if (currentLevel <= LogLevel.DEBUG) {
    console.error('[DEBUG]', ...args)
  }
}

export function info(...args: any[]): void {
  if (currentLevel <= LogLevel.INFO) {
    console.error('[INFO]', ...args)
  }
}

export function warn(...args: any[]): void {
  if (currentLevel <= LogLevel.WARN) {
    console.error('[WARN]', ...args)
  }
}

export function error(...args: any[]): void {
  if (currentLevel <= LogLevel.ERROR) {
    console.error('[ERROR]', ...args)
  }
}
