import React from 'react'
import { Box, Text } from 'ink'
import { useAppState } from '../../state/AppState.js'

export function MessageList() {
  const messages = useAppState((s) => s.messages)
  const isStreaming = useAppState((s) => s.isStreaming)
  const currentStreamedText = useAppState((s) => s.currentStreamedText)
  const error = useAppState((s) => s.error)

  return (
    <Box flexDirection="column" flexGrow={1}>
      {messages.map((msg) => (
        <MessageRow key={msg.id} message={msg} />
      ))}

      {isStreaming && currentStreamedText && (
        <Box>
          <Text color="green">✦ </Text>
          <Text>{currentStreamedText}</Text>
        </Box>
      )}

      {error && (
        <Box>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}
    </Box>
  )
}

function MessageRow({ message }: { message: any }) {
  switch (message.role) {
    case 'system':
      return (
        <Box>
          <Text color="gray">{message.content}</Text>
        </Box>
      )

    case 'user':
      return (
        <Box marginTop={1}>
          <Box marginRight={1}>
            <Text color="blue" bold>◆</Text>
          </Box>
          <Text bold color="white">{typeof message.content === 'string' ? message.content : '(content)'}</Text>
        </Box>
      )

    case 'assistant':
      return (
        <Box flexDirection="column" marginTop={1}>
          {typeof message.content === 'string' ? (
            <Text>{message.content}</Text>
          ) : (
            (message.content as any[])?.map((block: any, i: number) => {
              if (block.type === 'text' && block.text) {
                return <Text key={i}>{block.text}</Text>
              }
              if (block.type === 'tool_use') {
                return (
                  <Box key={i} marginTop={1}>
                    <Text color="yellow">⚡ Using tool: {block.name}</Text>
                  </Box>
                )
              }
              return null
            })
          )}
        </Box>
      )

    case 'tool_result':
      return (
        <Box>
          <Text color="cyan">▸ </Text>
          <Text color="gray">
            [{message.toolName}] {typeof message.content === 'string'
              ? message.content.slice(0, 200)
              : '(result)'}
            {typeof message.content === 'string' && message.content.length > 200 ? '...' : ''}
          </Text>
        </Box>
      )

    default:
      return null
  }
}
