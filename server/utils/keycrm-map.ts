export const KEYCRM_PIPELINE_ID = 1
export const KEYCRM_SOURCE_ID = 1

export const KEYCRM_API_URL = 'https://openapi.keycrm.app/v1/pipelines/cards'

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
} as const
