export type Listener = () => void

export interface Store<T> {
  getState(): T
  setState(partial: Partial<T>): void
  subscribe(listener: Listener): () => void
}

export function createStore<T>(
  initialState: T,
  onChange?: (prev: T, next: T) => void
): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  return {
    getState: (): T => state,
    setState: (partial: Partial<T>): void => {
      const prev = state
      state = { ...state, ...partial }
      for (const listener of listeners) {
        listener()
      }
      onChange?.(prev, state)
    },
    subscribe: (listener: Listener): (() => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
