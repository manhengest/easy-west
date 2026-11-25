import { describe, expect, it } from 'vitest'
import { MATCH_WINDOW_MS, pendingFromClick, pendingFromForm, type PendingLead } from '~/shared/pending-lead'
import { validLeadSubmitBody } from '../fixtures/leads'
import { maintainPendingLeads, type RecentChatCard } from '~/server/utils/pending-maintenance'

const NOW = Date.parse('2026-11-25T06:16:50.000Z')

function form(leadId: string, ageMs: number, extras: Partial<PendingLead> = {}): PendingLead {
  const record = pendingFromForm(leadId, validLeadSubmitBody(), new Date(NOW - ageMs).toISOString())
  if (!record) {
    throw new Error('expected a messenger form')
  }
  return { ...record, ...extras }
}

function harness(records: PendingLead[], chats: RecentChatCard[] = []) {
  const saved: PendingLead[] = []
  const created: string[] = []
  const filled: number[] = []
  return {
    saved,
    created,
    filled,
    run: () => maintainPendingLeads({
      now: NOW,
      records,
      read: async (leadId) => records.find(record => record.leadId === leadId) ?? null,
      save: async (record) => {
        saved.push(record)
        const index = records.findIndex(item => item.leadId === record.leadId)
        if (index >= 0) {
          records[index] = record
        }
      },
      createFormCard: async (record) => {
        created.push(record.leadId)
        return 80 + created.length
      },
      listRecentChats: async () => chats,
      fillChat: async (card) => {
        filled.push(card.id)
        return true
      },
    }),
  }
}

describe('maintainPendingLeads', () => {
  it('creates Лід N for a messenger form that is still unmatched after 15 minutes', async () => {
    const records = [form('abc1234567', MATCH_WINDOW_MS)]
    const task = harness(records)

    await expect(task.run()).resolves.toEqual({ forms: 1, chats: 0 })
    expect(task.created).toEqual(['abc1234567'])
    expect(records[0]?.formCardId).toBe(81)
  })

  it('leaves a fresh form and an already matched form without a card', async () => {
    const records = [
      form('aaaaaaaaaa', MATCH_WINDOW_MS - 1),
      form('bbbbbbbbbb', MATCH_WINDOW_MS + 1000, { matchedCardId: 15 }),
    ]
    const task = harness(records)

    await expect(task.run()).resolves.toEqual({ forms: 0, chats: 0 })
    expect(task.created).toEqual([])
  })

  it('fills one recent chat and skips the channel when two leads are waiting', async () => {
    const click = pendingFromClick({
      leadId: 'abc1234567',
      channel: 'telegram',
      source: 'hero',
      locale: 'ua',
      device: 'mobile',
      gclid: 'click-a',
    }, new Date(NOW - 60_000).toISOString())
    const other = { ...click, leadId: 'dddddddddd' }
    const chat = (id: number): RecentChatCard => ({
      id,
      sourceId: 4,
      statusTitle: 'Нова заявка',
      createdAt: new Date(NOW).toISOString(),
      channel: 'telegram',
    })

    const one = harness([click], [chat(518)])
    await expect(one.run()).resolves.toEqual({ forms: 0, chats: 1 })
    expect(one.filled).toEqual([518])
    expect(one.saved[0]?.matchedCardId).toBe(518)

    const two = harness([click, other], [chat(519)])
    await expect(two.run()).resolves.toEqual({ forms: 0, chats: 0 })
    expect(two.filled).toEqual([])
  })
})
