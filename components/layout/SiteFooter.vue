<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <NuxtLink :to="localePath('/')" class="site-footer__logo-link">
            <img
              :src="LOGO_HORIZONTAL_SRC"
              alt="EASY WEST"
              class="site-footer__logo"
              loading="lazy"
              decoding="async"
            >
          </NuxtLink>
          <p class="site-footer__description">
            {{ t('footer.description') }}
          </p>
        </div>

        <nav class="site-footer__nav" :aria-label="t('footer.navHeading')">
          <h3 class="site-footer__heading">
            {{ t('footer.navHeading') }}
          </h3>
          <ul class="site-footer__links">
            <li v-for="link in footerNavLinks" :key="link.hash">
              <NuxtLink :to="{ path: localePath('/'), hash: link.hash }">
                {{ t(link.labelKey) }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="site-footer__contacts">
          <h3 class="site-footer__heading">
            {{ t('footer.contactsHeading') }}
          </h3>
          <ul class="site-footer__contact-list">
            <li v-for="item in contactItems" :key="item.id">
              <ClientOnly v-if="item.revealProtected">
                <button
                  type="button"
                  class="site-footer__contact-link"
                  @click="openMessenger(item.channel)"
                >
                  <UiIcon :name="item.icon" size="sm" class="site-footer__contact-icon" />
                  <span>{{ item.label }}</span>
                </button>
                <template #fallback>
                  <span class="site-footer__contact-link" role="presentation">
                    <UiIcon :name="item.icon" size="sm" class="site-footer__contact-icon" />
                    <span>{{ item.label }}</span>
                  </span>
                </template>
              </ClientOnly>
              <a
                v-else
                :href="item.href"
                class="site-footer__contact-link"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener noreferrer' : undefined"
              >
                <UiIcon :name="item.icon" size="sm" class="site-footer__contact-icon" />
                <span>{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="site-footer__bar">
        <p class="site-footer__copy">
          {{ t('footer.copyright', { year }) }}
        </p>
        <nav class="site-footer__legal" :aria-label="t('nav.legal')">
          <NuxtLink :to="localePath('/privacy')">
            {{ t('footer.privacyPolicy') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/cookies')">
            {{ t('nav.cookies') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/terms')">
            {{ t('nav.terms') }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { LOGO_HORIZONTAL_SRC } from '~/content/brand-assets'

const { t } = useI18n()
const localePath = useLocalePath()
const { links } = useContacts()
const { openMessenger } = useMessengerActions()
const year = new Date().getFullYear()

const footerNavLinks = [
  { hash: '#segments', labelKey: 'nav.services' },
  { hash: '#process', labelKey: 'nav.howItWorks' },
  { hash: '#reviews', labelKey: 'nav.reviews' },
  { hash: '#faq', labelKey: 'nav.questions' },
  { hash: '#contacts', labelKey: 'nav.contacts' },
] as const

const contactItems = computed(() => [
  {
    id: 'phone',
    href: links.value.phoneHref,
    label: links.value.phone,
    icon: 'lucide:phone',
    external: false,
    revealProtected: false as const,
  },
  {
    id: 'whatsapp',
    channel: 'whatsapp' as const,
    label: t('contacts.whatsapp'),
    icon: 'simple-icons:whatsapp',
    revealProtected: true as const,
  },
  {
    id: 'telegram',
    channel: 'telegram' as const,
    label: t('contacts.telegram'),
    icon: 'simple-icons:telegram',
    revealProtected: true as const,
  },
  {
    id: 'viber',
    channel: 'viber' as const,
    label: t('contacts.viber'),
    icon: 'simple-icons:viber',
    revealProtected: true as const,
  },
  {
    id: 'email',
    href: links.value.emailHref,
    label: links.value.email,
    icon: 'lucide:mail',
    external: false,
    revealProtected: false as const,
  },
])
</script>
