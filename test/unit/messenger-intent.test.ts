import { describe, expect, it } from 'vitest'
import {
  parseMessengerPipelineId,
  readMessengerIntentCardId,
  writeMessengerIntentCardId,
  MESSENGER_INTENT_STORAGE_KEY,
} from '~/shared/messenger-intent'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe('parseMessengerPipelineId', () => {
  it('reads a positive pipeline id', () => {
    expect(parseMessengerPipelineId('7')).toBe(7)
    expect(parseMessengerPipelineId(4)).toBe(4)
  })

  it('treats an empty or invalid value as unset', () => {
    expect(parseMessengerPipelineId('')).toBeNull()
    expect(parseMessengerPipelineId('0')).toBeNull()
    expect(parseMessengerPipelineId('abc')).toBeNull()
    expect(parseMessengerPipelineId(undefined)).toBeNull()
  })
})

describe('messenger intent session', () => {
  it('stores one card id for the tab', () => {
    const storage = memoryStorage()
    expect(readMessengerIntentCardId(storage)).toBeNull()
    writeMessengerIntentCardId(storage, 148)
    expect(readMessengerIntentCardId(storage)).toBe(148)
    expect(storage.getItem(MESSENGER_INTENT_STORAGE_KEY)).toContain('148')
  })

  it('ignores a broken stored value', () => {
    const storage = memoryStorage()
    storage.setItem(MESSENGER_INTENT_STORAGE_KEY, '{')
    expect(readMessengerIntentCardId(storage)).toBeNull()
  })
})
