import { Command } from 'commander'
import type { Config } from './utils/config.js'
import { init } from './entrypoints/init.js'
import { createStore, type Store } from './state/store.js'
import { getDefaultAppState, type AppState } from './state/AppState.js'
import { onChangeAppState } from './state/onChangeAppState.js'
import { launchRepl } from './screens/REPL.js'
import { runHeadless } from './cli/print.js'
import { getTools } from './tools.js'
import { loadCommands } from './commands.js'
import { resolveProvider } from './integrations/routeMetadata.js'
import { createAPIClient } from './services/api/client.js'
import { setupPermissions } from './utils/permissions/permissionSetup.js'

export type MainOptions = {
  version: string
  config: Config
  args: string[]
}

export async function runMain(options: MainOptions): Promise<void> {
  const { version, config, args } = options

    // Create the Commander program
  const program = new Command()
    .name('codeforge')
    .version(version)
    .description('A multi-provider coding-agent CLI')
    .argument('[prompt...]', 'Prompt to send to the model')
    .option('--model <model>', 'Model to use')
    .option('--provider <provider>', 'Provider to use (openai, anthropic, gemini, ollama)')
    .option('--print', 'Non-interactive mode, print response')
    .option('--bg', 'Run in background')
    .option('--name <name>', 'Session name')
    .option('--provider-env-file <path>', 'Path to .env file')
    .option('--simple', 'Simple mode (limited tools)')
    .option('--verbose', 'Verbose logging')
    .allowUnknownOption(false)

  // Deferred init in preAction hook
  program.hook('preAction', async () => {
    await init(config)
  })

  program.action(async (promptArgs, opts) => {
    const prompt = promptArgs ? promptArgs.join(' ') : ''

    // Resolve provider and model
    const provider = opts.provider || config.defaultProvider || 'openai-compatible'
    const model = opts.model || config.defaultModel || 'gpt-4o'
    const resolvedProvider = resolveProvider(provider, model)

    // Create API client
    const apiClient = createAPIClient(resolvedProvider)

    // Set up permissions
    const permissionContext = setupPermissions({
      mode: opts.simple ? 'bypassPermissions' : 'default',
    })

    // Get tools
    const tools = getTools(permissionContext)

    // Load commands
    const commands = loadCommands()

    // Create state store
    const store = createStore<AppState>(
      getDefaultAppState({
        model,
        provider: resolvedProvider.name,
        tools,
        commands,
        permissionMode: permissionContext.mode,
      }),
      onChangeAppState
    )

    // Branch: headless or interactive
    if (opts.print) {
      await runHeadless({ store, apiClient, tools, model, prompt })
    } else {
      await launchRepl({ store, apiClient, tools, commands, model, version })
    }
  })

  await program.parseAsync(args, { from: 'user' })
}
