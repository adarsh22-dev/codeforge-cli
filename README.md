# Codeforge

A multi-provider coding-agent CLI — forge code with any LLM.

Codeforge is a terminal-first AI coding assistant that works with OpenAI, Anthropic, Gemini, Ollama, and any OpenAI-compatible API. It runs a tool-calling loop: the model suggests tools (bash, file read/write/edit, grep, glob, web search), the CLI executes them, and feeds results back to the model — all in an interactive terminal UI.

---

## Prerequisites

- **Node.js >= 22.0.0** — [Download](https://nodejs.org/)
- **Bun** — `npm install -g bun` (required to build from source)
- **ripgrep** (recommended for Grep tool) — `winget install BurntSushi.ripgrep` or `scoop install ripgrep`
- An **API key** from at least one provider

---

## Install

### From source (recommended)

```bash
# 1. Install bun (one-time)
npm install -g bun

# 2. Clone and enter the project
git clone https://github.com/adarsh22-dev/codeforge-cli.git
cd codeforge-cli

# 3. Install deps and build
bun install
bun run build

# 4. Use it
node bin/codeforge

# (Optional) Install globally so you can run 'codeforge' anywhere
npm install -g .
codeforge
```

```bash
git clone https://github.com/adarsh22-dev/codeforge-cli.git
cd codeforge-cli
bun install
bun run build
node bin/codeforge
```

---

## Quick Start

### 1. Set an API key

**PowerShell:**
```powershell
$env:OPENAI_API_KEY = "sk-your-key-here"
```

**Command Prompt:**
```cmd
set OPENAI_API_KEY=sk-your-key-here
```

Or create a `.env` file:
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o
```

Then load it:
```
node bin/codeforge --provider-env-file .env
```

### 2. Start the interactive REPL

```bash
node bin/codeforge
```

You'll see:
```
  Codeforge v0.1.0 — Forge code with any LLM
  Type /help for commands, /exit to quit

❯
```

Type a prompt like `explain the project structure` and press Enter. The model will respond using tools (read files, search code, etc.).

### 3. One-shot mode (no REPL)

```bash
node bin/codeforge --print "explain what this project does"
```

Prints the response and exits — useful in scripts and CI/CD.

### 4. Background mode

```bash
node bin/codeforge --bg --name my-task "fix failing tests"
node bin/codeforge ps          # list sessions
node bin/codeforge logs my-task  # view logs
node bin/codeforge kill my-task  # remove session
```

---

## How to Test It Works

### Quick smoke test (no API key needed)

```bash
# 1. Check version
node dist/cli.mjs --version

# 2. Check help
node dist/cli.mjs --help

# 3. Run doctor
bun run doctor:runtime

# 4. Test slash commands via pipe
echo "/help`n/doctor`n/exit" | node dist/cli.mjs
```

### Test with a real API key

```powershell
$env:OPENAI_API_KEY = "sk-your-real-key"

# Test headless mode
node bin/codeforge --print "say hello in one word"

# Test interactive mode
node bin/codeforge
# Then type: "list the files in the current directory"
```

### Test with local Ollama (free, no API key)

```powershell
# 1. Install Ollama from https://ollama.com
# 2. Pull a model
ollama pull qwen2.5-coder:7b

# 3. Start Codeforge with Ollama
$env:OPENAI_BASE_URL = "http://localhost:11434/v1"
$env:OPENAI_MODEL = "qwen2.5-coder:7b"
node bin/codeforge
```

### Test provider switching

```powershell
# Set a key first, then switch provider from inside the REPL
node bin/codeforge
# Then type: /provider ollama
# Then type: /model qwen2.5-coder:7b
```

---

## Provider Configuration

| Provider | Env Variables |
|----------|--------------|
| **OpenAI** | `OPENAI_API_KEY`, `OPENAI_MODEL` (default: gpt-4o) |
| **Ollama** (local) | `OPENAI_BASE_URL=http://localhost:11434/v1`, `OPENAI_MODEL=qwen2.5-coder:7b` |
| **Anthropic Claude** | `ANTHROPIC_API_KEY` |
| **Google Gemini** | `GEMINI_API_KEY` |
| **OpenRouter** | `OPENAI_BASE_URL=https://openrouter.ai/api/v1`, `OPENAI_API_KEY` |
| **Any OpenAI-compatible** | `OPENAI_BASE_URL=<url>`, `OPENAI_API_KEY` |

Set these before launching. From inside the REPL, use `/provider <name>` and `/model <name>` to switch on the fly.

---

## Slash Commands (inside the REPL)

| Command | Description |
|---------|-------------|
| `/help`, `/h` | Show available commands |
| `/model <name>` | Switch model (e.g. `/model gpt-4o`) |
| `/provider <name>` | Switch provider (e.g. `/provider ollama`) |
| `/compact` | Compact conversation to save tokens |
| `/cost` | Show session cost |
| `/doctor` | Run system diagnostics |
| `/clear` | Clear screen |
| `/exit`, `/quit` | Exit codeforge |

---

## Available Tools

The model can invoke these tools to help you:

| Tool | Description |
|------|-------------|
| **Bash** | Execute shell commands with streaming output |
| **FileRead** | Read file contents with optional line range |
| **FileWrite** | Write/append content to files |
| **FileEdit** | Find-and-replace text edits with diff output |
| **Grep** | Regex search across files (requires ripgrep) |
| **Glob** | Find files by glob pattern |
| **WebSearch** | Search the web via DuckDuckGo |
| **WebFetch** | Fetch and render URL content |

---

## CLI Options

```
Usage: codeforge [options] [prompt...]

Arguments:
  prompt                      Prompt to send to the model

Options:
  -V, --version               output the version number
  --model <model>             Model to use (e.g. gpt-4o)
  --provider <provider>       Provider (openai, anthropic, gemini, ollama)
  --print                     Non-interactive mode, print response
  --bg                        Run in background
  --name <name>               Session name (for --bg)
  --provider-env-file <path>  Path to .env file
  --simple                    Simple mode (limited tools)
  --verbose                   Verbose logging
  -h, --help                  display help for command
```

---

## Project Structure

```
codeforge/
├── bin/codeforge           # CLI launcher
├── dist/cli.mjs            # Built CLI bundle (452 KB)
├── src/
│   ├── entrypoints/        # Bootstrap + init
│   ├── main.tsx            # Commander orchestration
│   ├── cli/                # Background sessions, headless
│   ├── state/              # App state (vanilla store + React)
│   ├── Tool.ts             # Tool interface
│   ├── tools/              # Tool implementations
│   │   ├── BashTool/
│   │   ├── FileReadTool/
│   │   ├── FileWriteTool/
│   │   ├── FileEditTool/
│   │   ├── GrepTool/
│   │   ├── GlobTool/
│   │   ├── WebSearchTool/
│   │   └── WebFetchTool/
│   ├── query.ts            # LLM tool-calling loop
│   ├── services/api/       # Provider API clients (OpenAI, Anthropic, Gemini)
│   ├── services/mcp/       # MCP client
│   ├── screens/            # React/Ink terminal UI
│   ├── components/         # UI components
│   ├── commands/           # Slash commands
│   ├── integrations/       # Provider routing + metadata
│   ├── utils/              # Utilities
│   └── types/              # TypeScript types
├── scripts/
│   ├── build.ts            # Bun bundler build script
│   └── system-check.ts     # Runtime diagnostics
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Build + run
bun run dev

# TypeScript check
bun run typecheck

# Run tests
bun test

# Full test (single concurrency)
bun run test:full

# System diagnostics
bun run doctor:runtime

# Smoke test (build + version)
bun run smoke

# Dead code analysis
bun run deadcode

# Full check
bun run check
```

### Windows launchers

- Double-click **`start-codeforge.bat`** to launch the REPL
- Or run **`start-codeforge.ps1`** from PowerShell

---

## License

MIT
