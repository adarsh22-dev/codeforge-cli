import React, { createContext, useContext, useState } from 'react'
import { useSyncExternalStore } from 'react'
import type { Store } from './store.js'
import type { Message } from '../types/message.js'
import type { Command } from '../types/command.js'
import type { Tool, ToolResult } from '../Tool.js'
import type { PermissionMode } from '../utils/permissions/PermissionMode.js'

export type AppState = {
  messages: Message[]
  isProcessing: boolean
  isStreaming: boolean
  model: string
  provider: string
  permissionMode: PermissionMode
  tools: Tool<any, any, any>[]
  commands: Command[]
  currentStreamedText: string
  toolProgress: Record<string, string>
  error: string | null
}

export type AppStateConfig = {
  model: string
  provider: string
  tools: Tool<any, any, any>[]
  commands: Command[]
  permissionMode: PermissionMode
}

export function getDefaultAppState(config?: AppStateConfig): AppState {
  return {
    messages: [],
    isProcessing: false,
    isStreaming: false,
    model: config?.model ?? 'gpt-4o',
    provider: config?.provider ?? 'openai',
    permissionMode: config?.permissionMode ?? { mode: 'default' },
    tools: config?.tools ?? [],
    commands: config?.commands ?? [],
    currentStreamedText: '',
    toolProgress: {},
    error: null,
  }
}

const AppStateContext = createContext<Store<AppState> | null>(null)

export function AppStateProvider({
  store,
  children,
}: {
  store: Store<AppState>
  children: React.ReactNode
}) {
  return (
    <AppStateContext.Provider value={store}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState<T>(selector: (state: AppState) => T): T {
  const store = useContext(AppStateContext)
  if (!store) throw new Error('useAppState must be used within AppStateProvider')
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  )
}

export function useSetAppState() {
  const store = useContext(AppStateContext)
  if (!store) throw new Error('useSetAppState must be used within AppStateProvider')
  return store.setState
}

export function useAppStateStore() {
  const store = useContext(AppStateContext)
  if (!store) throw new Error('useAppStateStore must be used within AppStateProvider')
  return store
}
