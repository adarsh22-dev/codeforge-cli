export type CommandType = 'prompt' | 'local' | 'local-jsx'

export type Command = {
  type: CommandType
  name: string
  description: string
  aliases?: string[]
  isEnabled?: () => boolean
  userFacingName?: () => string
  prompt?: string
  execute?: (args: string[]) => Promise<void> | void
}
