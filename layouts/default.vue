<template>
  <div class="site">
    <SiteHeader />
    <main class="site__main">
      <slot />
    </main>
    <SiteFooter />
    <CookieBanner />
    <UiToastHost />
    <LeadFormHost v-model="leadOpen" :source="leadSource" />
  </div>
</template>

<script setup lang="ts">
const { leadOpen, leadSource } = useLeadHost()
</script>
