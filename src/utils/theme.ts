export type ThemeName = 'dark' | 'light'

export type Theme = {
  name: ThemeName
  colors: {
    primary: string
    secondary: string
    success: string
    error: string
    warning: string
    text: string
    muted: string
    background: string
    border: string
  }
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#0ea5e9',
    secondary: '#8b5cf6',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    text: '#e2e8f0',
    muted: '#64748b',
    background: '#0f172a',
    border: '#1e293b',
  },
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#0284c7',
    secondary: '#7c3aed',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
    text: '#1e293b',
    muted: '#94a3b8',
    background: '#ffffff',
    border: '#e2e8f0',
  },
}

let currentTheme: Theme = darkTheme

export function getTheme(): Theme {
  return currentTheme
}

export function setTheme(theme: ThemeName): void {
  currentTheme = theme === 'light' ? lightTheme : darkTheme
}
