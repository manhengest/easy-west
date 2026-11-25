import type { MessengerLeadChannel } from '~/shared/lead-constants'

export const KEYCRM_PIPELINE_ID = 1
export const KEYCRM_SOURCE_ID = 1

/** Order sources read from KeyCRM on 2026-11-25. Site stays KEYCRM_SOURCE_ID. */
export const KEYCRM_MESSENGER_SOURCE_IDS = {
  whatsapp: 2,
  viber: 3,
  telegram: 4,
} as const

export const KEYCRM_NEW_REQUEST_STATUS_ID = 1

export const KEYCRM_API_ORIGIN = 'https://openapi.keycrm.app/v1'
export const KEYCRM_API_URL = `${KEYCRM_API_ORIGIN}/pipelines/cards`

/** Header KeyCRM must send on the lead-status webhook. Not the API key. */
export const KEYCRM_WEBHOOK_SECRET_HEADER = 'x-keycrm-webhook-secret'

export const KEYCRM_STATUS = {
  newRequest: 'Нова заявка',
  qualified: 'Кваліфіковано',
  booked: 'Заброньовано',
} as const

/** Custom field uuids from the Переїзди pipeline. Not secrets. */
export const KEYCRM_FIELDS = {
  from: 'LD_1001',
  to: 'LD_1002',
  leadId: 'LD_1003',
  firstSource: 'LD_1004',
  firstMedium: 'LD_1005',
  firstCampaign: 'LD_1006',
  firstContent: 'LD_1007',
  firstTerm: 'LD_1008',
  firstVisit: 'LD_1009',
  firstPage: 'LD_1010',
  firstGclid: 'LD_1011',
  firstGbraid: 'LD_1012',
  firstWbraid: 'LD_1013',
  firstFbclid: 'LD_1014',
  gclid: 'LD_1015',
  gbraid: 'LD_1016',
  wbraid: 'LD_1017',
  fbclid: 'LD_1018',
  channel: 'LD_1019',
  locale: 'LD_1020',
  gaClientId: 'LD_1021',
  fbp: 'LD_1022',
  // Next to Реклама: заброньовано (LD_1024). Confirm after the fields are created in KeyCRM.
  lastSource: 'LD_1025',
  lastMedium: 'LD_1026',
  lastCampaign: 'LD_1027',
  lastContent: 'LD_1028',
  lastTerm: 'LD_1029',
} as const

export function messengerChannelForSource(sourceId: number | null | undefined): MessengerLeadChannel | null {
  if (sourceId === KEYCRM_MESSENGER_SOURCE_IDS.whatsapp) {
    return 'whatsapp'
  }
  if (sourceId === KEYCRM_MESSENGER_SOURCE_IDS.viber) {
    return 'viber'
  }
  if (sourceId === KEYCRM_MESSENGER_SOURCE_IDS.telegram) {
    return 'telegram'
  }
  return null
}
