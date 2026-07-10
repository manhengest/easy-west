/**
 * Capture UTM / referrer on first page load — before the lead form modal mounts.
 */
export default defineNuxtPlugin(() => {
  const { captureFromQuery } = useLeadAttribution()

  onMounted(captureFromQuery)

  const route = useRoute()
  watch(() => route.fullPath, captureFromQuery)
})
