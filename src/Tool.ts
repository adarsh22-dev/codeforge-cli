import type { z } from 'zod'
import type { PermissionResult } from './types/permissions.js'
import type { AppState } from './state/AppState.js'
import type { ToolProgressData } from './types/tools.js'

export type ToolInput = Record<string, unknown>
export type AnyObject = Record<string, unknown>

export type ValidationResult =
  | { result: true }
  | { result: false; message: string; errorCode: number }

export type ToolResult<Output> = {
  type: 'success' | 'error'
  output?: Output
  error?: string
}

export type ToolUseContext = {
  getAppState: () => AppState
  setAppState: (partial: Partial<AppState>) => void
  abortController: AbortController
  options: {
    model: string
    provider: string
  }
}

export interface Tool<Input extends AnyObject, Output, ProgressData = ToolProgressData> {
  name: string
  aliases?: string[]
  inputSchema: z.ZodType<Input>
  userFacingName?: string

  description(input: Input): string
  prompt(): string

  isEnabled(): boolean
  isReadOnly(): boolean
  isConcurrencySafe(): boolean
  isDestructive(): boolean

  validateInput(input: Input): ValidationResult
  checkPermissions(
    input: Input,
    context: ToolUseContext
  ): PermissionResult | Promise<PermissionResult>

  call(
    input: Input,
    context: ToolUseContext,
    onProgress?: (progress: ProgressData) => void
  ): Promise<ToolResult<Output>>

  renderToolUseMessage?(input: Input): React.ReactNode
  renderToolResultMessage?(result: ToolResult<Output>, input: Input): React.ReactNode
  renderToolUseProgressMessage?(progress: ProgressData): React.ReactNode
  renderToolUseRejectedMessage?(reason: string): React.ReactNode
  renderToolUseErrorMessage?(error: string): React.ReactNode
}

export type ToolDef<Input extends AnyObject, Output, ProgressData = ToolProgressData> = {
  name: string
  aliases?: string[]
  inputSchema: z.ZodType<Input>
  userFacingName?: string
  description: (input: Input) => string
  prompt: () => string
  isEnabled?: () => boolean
  isReadOnly?: () => boolean
  isConcurrencySafe?: () => boolean
  isDestructive?: () => boolean
  validateInput?: (input: Input) => ValidationResult
  checkPermissions?: (
    input: Input,
    context: ToolUseContext
  ) => PermissionResult | Promise<PermissionResult>
  call: (
    input: Input,
    context: ToolUseContext,
    onProgress?: (progress: ProgressData) => void
  ) => Promise<ToolResult<Output>>
  renderToolUseMessage?: (input: Input) => React.ReactNode
  renderToolResultMessage?: (result: ToolResult<Output>, input: Input) => React.ReactNode
  renderToolUseProgressMessage?: (progress: ProgressData) => React.ReactNode
}

export function buildTool<Input extends AnyObject, Output, ProgressData = ToolProgressData>(
  def: ToolDef<Input, Output, ProgressData>
): Tool<Input, Output, ProgressData> {
  return {
    ...def,
    isEnabled: def.isEnabled ?? (() => true),
    isReadOnly: def.isReadOnly ?? (() => false),
    isConcurrencySafe: def.isConcurrencySafe ?? (() => false),
    isDestructive: def.isDestructive ?? (() => false),
    validateInput:
      def.validateInput ??
      (() => ({ result: true } as ValidationResult)),
    checkPermissions:
      def.checkPermissions ??
      (() => ({ allowed: true } as PermissionResult)),
  }
}
