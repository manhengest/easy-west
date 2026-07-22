import {
  FAQ_ITEM_COUNT,
  GALLERY_MEDIA,
  GEOGRAPHY_ROUTE_ICONS,
  GEOGRAPHY_ROUTE_IDS,
  GEOGRAPHY_TRIGGER_COUNT,
  GEOGRAPHY_TRIGGER_ICONS,
  HERO_BENEFIT_COUNT,
  PROCESS_PHASE_COUNT,
  PROCESS_PHASE_ICONS,
  PROCESS_PHASE_RANGES,
  REVIEW_MEDIA,
  SEGMENT_ICONS,
  SEGMENT_IDS,
  TIMELINE_STEP_COUNT,
} from '~/content/landing-media'
import type {
  FaqItem,
  GalleryImage,
  ProcessPhase,
  ReviewSlide,
  RouteHighlight,
  Segment,
  Step,
} from '~/types/content'

export function useLandingContent() {
  const { t } = useI18n()

  const segments = computed<Segment[]>(() =>
    SEGMENT_IDS.map((id, index) => ({
      id,
      icon: SEGMENT_ICONS[id],
      title: t(`segments.items.${index}.title`),
      teaser: t(`segments.items.${index}.teaser`),
      detail: t(`segments.items.${index}.detail`),
    })),
  )

  const steps = computed<Step[]>(() =>
    Array.from({ length: TIMELINE_STEP_COUNT }, (_, index) => ({
      id: t(`timeline.steps.${index}.id`),
      title: t(`timeline.steps.${index}.title`),
      description: t(`timeline.steps.${index}.description`),
      number: index + 1,
    })),
  )

  const processPhases = computed<ProcessPhase[]>(() =>
    Array.from({ length: PROCESS_PHASE_COUNT }, (_, phaseIndex) => {
      const [start, end] = PROCESS_PHASE_RANGES[phaseIndex]!
      return {
        id: `phase-${phaseIndex + 1}`,
        title: t(`timeline.phases.${phaseIndex}.title`),
        icon: PROCESS_PHASE_ICONS[phaseIndex]!,
        steps: steps.value.slice(start, end),
      }
    }),
  )

  const faqItems = computed<FaqItem[]>(() =>
    Array.from({ length: FAQ_ITEM_COUNT }, (_, index) => ({
      id: t(`faq.items.${index}.id`),
      title: t(`faq.items.${index}.title`),
      description: t(`faq.items.${index}.description`),
    })),
  )

  const galleryImages = computed<GalleryImage[]>(() =>
    GALLERY_MEDIA.map((media, index) => ({
      ...media,
      alt: t(`gallery.images.${index}.alt`),
    })),
  )

  const reviewSlides = computed<ReviewSlide[]>(() =>
    REVIEW_MEDIA.map((media, index) => ({
      ...media,
      alt: t(`reviews.slides.${index}.alt`),
    })),
  )

  const routeHighlights = computed<RouteHighlight[]>(() =>
    GEOGRAPHY_ROUTE_IDS.map((id, index) => ({
      id,
      label: t(`geography.routes.${index}.label`),
      description: t(`geography.routes.${index}.description`),
      icon: GEOGRAPHY_ROUTE_ICONS[id],
    })),
  )

  const heroBenefits = computed(() =>
    Array.from({ length: HERO_BENEFIT_COUNT }, (_, index) =>
      t(`hero.benefits.${index}`),
    ),
  )

  const geographyTriggers = computed(() =>
    Array.from({ length: GEOGRAPHY_TRIGGER_COUNT }, (_, index) =>
      t(`geography.triggers.${index}`),
    ),
  )

  const geographyHighlights = computed(() =>
    Array.from({ length: GEOGRAPHY_TRIGGER_COUNT }, (_, index) => ({
      icon: GEOGRAPHY_TRIGGER_ICONS[index]!,
      text: t(`geography.triggers.${index}`),
    })),
  )

  return {
    segments,
    steps,
    processPhases,
    faqItems,
    galleryImages,
    reviewSlides,
    routeHighlights,
    heroBenefits,
    geographyTriggers,
    geographyHighlights,
  }
}
