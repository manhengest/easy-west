/**
 * Capture UTM / referrer on first page load — before the lead form modal mounts.
 *
 * Call immediately (client plugin) + watch with immediate:true.
 * onMounted alone is unreliable inside plugins and missed first-land UTMs.
 */
export default defineNuxtPlugin(() => {
  const { captureFromQuery } = useLeadAttribution()
  const route = useRoute()

  captureFromQuery()
  watch(() => route.fullPath, captureFromQuery, { immediate: true })
})
