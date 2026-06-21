import type { AppState } from './AppState.js'

export function onChangeAppState(prev: AppState, next: AppState): void {
  // Side-effect handlers run here when state changes
  // e.g., auto-compact, analytics, persistence

  if (prev.messages.length !== next.messages.length) {
    // Conversation changed — could auto-save, compact, etc.
  }

  if (prev.model !== next.model) {
    // Model changed
  }

  if (prev.provider !== next.provider) {
    // Provider changed
  }
}
