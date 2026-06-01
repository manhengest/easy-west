import { OG_IMAGE_PATH } from '~/content/brand-assets'

/**
 * Shared SEO for static legal / accessibility pages.
 * x-default canonical target is / (primary market, UA default locale).
 */
export function usePageSeo(titleKey: string) {
  const { t } = useI18n()
  const config = useRuntimeConfig()

  useLocaleHead({ seo: true })

  useSeoMeta({
    title: () => t(titleKey),
    description: () => t('seo.description'),
    ogTitle: () => t(titleKey),
    ogDescription: () => t('seo.description'),
    ogImage: () => `${config.public.siteUrl}${OG_IMAGE_PATH}`,
    twitterCard: 'summary_large_image',
  })
}
