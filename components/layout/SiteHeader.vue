<template>
  <header
    class="site-header"
    :class="{ 'site-header_scrolled': isScrolled }"
  >
    <div class="site-header__inner">
      <NuxtLink :to="localePath('/')" class="site-header__brand">
        <NuxtImg
          src="/brand/logo-horizontal.png"
          alt="EASY WEST"
          width="180"
          height="40"
          class="site-header__logo"
          preload
        />
      </NuxtLink>

      <nav class="site-header__nav" :aria-label="t('nav.primary')">
        <ul class="site-header__links">
          <li v-for="link in anchorLinks" :key="link.hash">
            <NuxtLink :to="{ path: localePath('/'), hash: link.hash }">
              {{ t(link.labelKey) }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="site-header__actions">
        <LocaleSwitcher />
        <UiButton
          type="button"
          variant="primary"
          class="site-header__cta"
          @click="onConsultationClick"
        >
          {{ t('nav.cta') }}
        </UiButton>
        <button
          type="button"
          class="site-header__menu-toggle"
          :aria-expanded="isMenuOpen"
          aria-controls="site-header-menu"
          :aria-label="t('nav.openMenu')"
          @click="openMenu"
        >
          <UiIcon name="lucide:menu" size="md" />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="site-header-menu">
        <div
          v-if="isMenuOpen"
          class="site-header-menu"
          @keydown.esc.prevent="closeMenu"
        >
          <div
            class="site-header-menu__backdrop"
            aria-hidden="true"
            @click="closeMenu"
          />
          <nav
            id="site-header-menu"
            ref="menuPanelRef"
            class="site-header-menu__panel"
            role="dialog"
            aria-modal="true"
            :aria-label="t('nav.primary')"
          >
            <header class="site-header-menu__header">
              <NuxtLink
                :to="localePath('/')"
                class="site-header-menu__brand"
                @click="closeMenu"
              >
                <NuxtImg
                  src="/brand/logo-horizontal.png"
                  alt="EASY WEST"
                  width="180"
                  height="40"
                  class="site-header__logo"
                />
              </NuxtLink>
              <button
                type="button"
                class="site-header-menu__close"
                :aria-label="t('overlay.close')"
                @click="closeMenu"
              >
                <UiIcon name="lucide:x" size="sm" />
              </button>
            </header>
            <ul class="site-header-menu__links">
              <li v-for="link in anchorLinks" :key="link.hash">
                <NuxtLink
                  :to="{ path: localePath('/'), hash: link.hash }"
                  @click="closeMenu"
                >
                  {{ t(link.labelKey) }}
                </NuxtLink>
              </li>
            </ul>
            <UiButton
              type="button"
              variant="primary"
              class="site-header-menu__cta"
              @click="onMobileConsultationClick"
            >
              {{ t('nav.cta') }}
            </UiButton>
          </nav>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { t } = useI18n()
const localePath = useLocalePath()
const openLead = useLeadHost()

const anchorLinks = [
  { hash: '#segments', labelKey: 'nav.services' },
  { hash: '#process', labelKey: 'nav.howItWorks' },
  { hash: '#reviews', labelKey: 'nav.reviews' },
  { hash: '#faq', labelKey: 'nav.questions' },
  { hash: '#contacts', labelKey: 'nav.contacts' },
] as const

const { y } = useWindowScroll()
const isScrolled = computed(() => y.value > 4)

const isMenuOpen = ref(false)
const menuPanelRef = ref<HTMLElement | null>(null)
const menuActive = computed(() => isMenuOpen.value)

useFocusTrap(menuPanelRef as Ref<HTMLElement | null>, menuActive)
useOverlayInert(menuActive)
useOverlayHistory(menuActive, 'site-header-menu', closeMenu)

const route = useRoute()
watch(() => route.fullPath, () => closeMenu())

function openMenu() {
  isMenuOpen.value = true
}

function closeMenu() {
  isMenuOpen.value = false
}

function onConsultationClick() {
  if (openLead) {
    openLead('header')
    return
  }
  navigateTo({ path: localePath('/'), hash: '#hero' })
}

function onMobileConsultationClick() {
  closeMenu()
  onConsultationClick()
}
</script>
