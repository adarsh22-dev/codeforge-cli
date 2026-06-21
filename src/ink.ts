import { render, type RenderOptions } from 'ink'

export function renderApp(node: React.ReactElement, options?: RenderOptions) {
  const instance = render(node, options)
  return instance
}
