import React from 'react'
import { Box, Text } from 'ink'
import { useAppState } from '../state/AppState.js'

export function StatusLine({ version }: { version: string }) {
  const isProcessing = useAppState((s) => s.isProcessing)
  const model = useAppState((s) => s.model)
  const provider = useAppState((s) => s.provider)
  const messages = useAppState((s) => s.messages)

  const statusIcon = isProcessing ? '●' : '○'
  const statusColor = isProcessing ? 'yellow' : 'green'

  return (
    <Box>
      <Text color={statusColor}>{statusIcon} </Text>
      <Text color="gray">
        {model} · {provider} · {messages.length} msgs · v{version}
      </Text>
    </Box>
  )
}
