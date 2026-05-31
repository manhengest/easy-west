<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const gtmId = useRuntimeConfig().public.gtmId

if (gtmId) {
  useHead({
    noscript: [
      {
        key: 'gtm-noscript',
        tagPosition: 'bodyOpen',
        innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
      },
    ],
  })
}
</script>
