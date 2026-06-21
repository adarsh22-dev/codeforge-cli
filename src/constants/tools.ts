export const TOOL_LIMITS = {
  bash: {
    maxTimeout: 600_000,
    defaultTimeout: 120_000,
    maxOutputSize: 10_000, // chars
  },
  fileRead: {
    maxSize: 1_000_000, // bytes
    defaultLinesPerRead: 500,
  },
  fileWrite: {
    maxSize: 500_000, // bytes
  },
  grep: {
    maxResults: 200,
    defaultTimeout: 30_000,
  },
  glob: {
    maxResults: 200,
  },
} as const
