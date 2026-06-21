import React, { useState, useCallback } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

export function PromptInput({ onSubmit }: { onSubmit: (input: string) => void }) {
  const [value, setValue] = useState('')

  const handleSubmit = useCallback(
    (input: string) => {
      onSubmit(input)
      setValue('')
    },
    [onSubmit]
  )

  return (
    <Box>
      <Text color="green">❯ </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Type a message or /help..."
      />
    </Box>
  )
}
