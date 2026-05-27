import type { GalleryImage, ReviewSlide } from '~/types/content'

export const SEGMENT_IDS = [
  'family',
  'europe',
  'furniture',
  'belongings',
  'relocation',
  'apartment',
] as const

export const SEGMENT_ICONS: Record<(typeof SEGMENT_IDS)[number], string> = {
  family: 'lucide:users',
  europe: 'lucide:map',
  furniture: 'lucide:sofa',
  belongings: 'lucide:package',
  relocation: 'lucide:plane',
  apartment: 'lucide:home',
}

export const TIMELINE_STEP_COUNT = 9

export const PROCESS_PHASE_COUNT = 4

/** Inclusive start, exclusive end indices into `timeline.steps`. */
export const PROCESS_PHASE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0, 3],
  [3, 5],
  [5, 7],
  [7, 9],
] as const

export const PROCESS_PHASE_ICONS = [
  'lucide:clipboard-list',
  'lucide:package',
  'lucide:truck',
  'lucide:circle-check-big',
] as const

export const TIMELINE_STEP_ICONS = [
  'lucide:file-text',
  'lucide:route',
  'lucide:calendar-days',
  'lucide:file-signature',
  'lucide:package',
  'lucide:plane',
  'lucide:wallet',
  'lucide:house',
  'lucide:badge-check',
] as const
export const FAQ_ITEM_COUNT = 8

export const GALLERY_MEDIA: Omit<GalleryImage, 'alt'>[] = [
  { src: '/images/gallery/gallery-1.svg', width: 800, height: 600 },
  { src: '/images/gallery/gallery-2.svg', width: 800, height: 600 },
  { src: '/images/gallery/gallery-3.svg', width: 800, height: 600 },
]

export const REVIEW_MEDIA: Omit<ReviewSlide, 'alt'>[] = [
  { id: 'r1', src: '/images/reviews/review-1.svg', width: 360, height: 640, channel: 'whatsapp' },
  { id: 'r2', src: '/images/reviews/review-2.svg', width: 360, height: 640, channel: 'telegram' },
  { id: 'r3', src: '/images/reviews/review-3.svg', width: 360, height: 640, channel: 'viber' },
  { id: 'r4', src: '/images/reviews/review-4.svg', width: 360, height: 640, channel: 'whatsapp' },
  { id: 'r5', src: '/images/reviews/review-5.svg', width: 360, height: 640, channel: 'telegram' },
  { id: 'r6', src: '/images/reviews/review-6.svg', width: 360, height: 640, channel: 'viber' },
  { id: 'r7', src: '/images/reviews/review-7.svg', width: 360, height: 640, channel: 'whatsapp' },
  { id: 'r8', src: '/images/reviews/review-8.svg', width: 360, height: 640, channel: 'telegram' },
]

export const HERO_BACKGROUND = '/images/hero/van.jpg' as const

export const GEOGRAPHY_MAP = {
  src: '/images/geography/map.jpg',
  width: 1440,
  height: 804,
} as const

export const GEOGRAPHY_ROUTE_COUNT = 2

export const GEOGRAPHY_ROUTE_IDS = ['ua-eu', 'eu-eu'] as const

export const GEOGRAPHY_ROUTE_ICONS: Record<(typeof GEOGRAPHY_ROUTE_IDS)[number], string> = {
  'ua-eu': 'lucide:arrow-right',
  'eu-eu': 'lucide:route',
}

export const GEOGRAPHY_TRIGGER_ICONS = ['lucide:zap', 'lucide:timer'] as const
export const HERO_BENEFIT_COUNT = 4
export const GEOGRAPHY_TRIGGER_COUNT = 2
