export interface Step {
  id: string
  title: string
  description: string
  icon?: string
  number?: number
}

export interface ProcessPhase {
  id: string
  title: string
  icon: string
  steps: Step[]
}

export interface Segment {
  id: string
  title: string
  teaser: string
  detail: string
  icon: string
}

export interface FaqItem {
  id: string
  title: string
  description: string
  important?: boolean
}

export interface GalleryImage {
  src: string
  width: number
  height: number
  alt: string
  placeholder?: string
}

export interface ReviewSlide {
  id: string
  src: string
  width: number
  height: number
  alt: string
  channel: 'whatsapp' | 'telegram' | 'viber'
}

export interface RouteHighlight {
  id: string
  label: string
  description: string
  icon: string
}
