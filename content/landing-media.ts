import type { GalleryImage, ReviewSlide } from '~/types/content'
import heroVideo from '~/assets/images/van.webm'
import geographyMap from '~/assets/images/map.jpg'
import gallery7 from '~/assets/images/gallery/gallery-7.jpg'
import gallery11 from '~/assets/images/gallery/gallery-11.jpg'
import gallery13 from '~/assets/images/gallery/gallery-13.jpg'
import gallery15 from '~/assets/images/gallery/gallery-15.jpg'
import gallery16 from '~/assets/images/gallery/gallery-16.jpg'
import gallery17 from '~/assets/images/gallery/gallery-17.jpg'
import gallery18 from '~/assets/images/gallery/gallery-18.jpg'
import gallery19 from '~/assets/images/gallery/gallery-19.jpg'
import gallery20 from '~/assets/images/gallery/gallery-20.jpg'
import gallery21 from '~/assets/images/gallery/gallery-21.jpg'
import gallery23 from '~/assets/images/gallery/gallery-23.jpg'
import gallery25 from '~/assets/images/gallery/gallery-25.jpg'
import gallery26 from '~/assets/images/gallery/gallery-26.jpg'
import gallery27 from '~/assets/images/gallery/gallery-27.jpg'
import gallery28 from '~/assets/images/gallery/gallery-28.jpg'
import gallery37 from '~/assets/images/gallery/gallery-37.jpg'
import rev1 from '~/assets/images/review/rev-1.jpg'
import rev2 from '~/assets/images/review/rev-2.jpg'
import rev3 from '~/assets/images/review/rev-3.jpg'
import rev4 from '~/assets/images/review/rev-4.jpg'
import rev5 from '~/assets/images/review/rev-5.jpg'
import rev6 from '~/assets/images/review/rev-6.jpg'
import rev7 from '~/assets/images/review/rev-7.jpg'
import rev8 from '~/assets/images/review/rev-8.jpg'
import rev9 from '~/assets/images/review/rev-9.jpg'
import rev10 from '~/assets/images/review/rev-10.jpg'

export const SEGMENT_IDS = [
  'uk-europe',
  'europe',
  'apartment',
  'furniture',
  'belongings',
  'appliances',
] as const

export const SEGMENT_ICONS: Record<(typeof SEGMENT_IDS)[number], string> = {
  'uk-europe': 'lucide:route',
  europe: 'lucide:map',
  apartment: 'lucide:building-2',
  furniture: 'lucide:sofa',
  belongings: 'lucide:package',
  appliances: 'lucide:refrigerator',
}

export const TIMELINE_STEP_COUNT = 13

export const PROCESS_PHASE_COUNT = 4

/** Inclusive start, exclusive end indices into `timeline.steps`. */
export const PROCESS_PHASE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0, 3],
  [3, 6],
  [6, 10],
  [10, 13],
] as const

export const PROCESS_PHASE_ICONS = [
  'lucide:clipboard-list',
  'lucide:package',
  'lucide:truck',
  'lucide:circle-check-big',
] as const

export const FAQ_ITEM_COUNT = 7

export const GALLERY_MEDIA: Omit<GalleryImage, 'alt'>[] = [
  { src: gallery11, width: 960, height: 1198 },
  { src: gallery18, width: 960, height: 1280 },
  { src: gallery27, width: 960, height: 1280 },
  { src: gallery37, width: 960, height: 1280 },
  { src: gallery7, width: 562, height: 1280 },
  { src: gallery13, width: 960, height: 1280 },
  { src: gallery15, width: 796, height: 1280 },
  { src: gallery16, width: 960, height: 1280 },
  { src: gallery17, width: 960, height: 1280 },
  { src: gallery19, width: 576, height: 1280 },
  { src: gallery20, width: 960, height: 1280 },
  { src: gallery21, width: 874, height: 760 },
  { src: gallery23, width: 960, height: 1280 },
  { src: gallery25, width: 576, height: 1280 },
  { src: gallery26, width: 960, height: 1280 },
  { src: gallery28, width: 1280, height: 960 },
]

export const REVIEW_MEDIA: Omit<ReviewSlide, 'alt'>[] = [
  { id: 'r1', src: rev1, width: 562, height: 1280, channel: 'whatsapp' },
  { id: 'r2', src: rev2, width: 562, height: 1280, channel: 'telegram' },
  { id: 'r3', src: rev3, width: 562, height: 1280, channel: 'viber' },
  { id: 'r4', src: rev4, width: 562, height: 1280, channel: 'whatsapp' },
  { id: 'r5', src: rev5, width: 562, height: 1280, channel: 'telegram' },
  { id: 'r6', src: rev6, width: 562, height: 1280, channel: 'viber' },
  { id: 'r7', src: rev7, width: 562, height: 1280, channel: 'whatsapp' },
  { id: 'r8', src: rev8, width: 562, height: 1280, channel: 'telegram' },
  { id: 'r9', src: rev9, width: 562, height: 1280, channel: 'viber' },
  { id: 'r10', src: rev10, width: 562, height: 1280, channel: 'whatsapp' },
]

export const HERO_VIDEO = heroVideo

export const GEOGRAPHY_MAP = {
  src: geographyMap,
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
