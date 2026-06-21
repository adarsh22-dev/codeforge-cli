export class CodeforgeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public recoverable: boolean = false
  ) {
    super(message)
    this.name = 'CodeforgeError'
  }
}

export class APIError extends CodeforgeError {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string
  ) {
    super(message, 'API_ERROR', true)
    this.name = 'APIError'
  }
}

export class PermissionError extends CodeforgeError {
  constructor(message: string) {
    super(message, 'PERMISSION_DENIED', false)
    this.name = 'PermissionError'
  }
}

export class ToolExecutionError extends CodeforgeError {
  constructor(
    message: string,
    public toolName: string
  ) {
    super(message, 'TOOL_EXECUTION_ERROR', true)
    this.name = 'ToolExecutionError'
  }
}
