import { defineComponent, type Component } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'

export async function mountComposable<T>(composable: () => T): Promise<T> {
  let result!: T

  const wrapper = defineComponent({
    setup() {
      result = composable()
      return () => null
    },
  })

  await mountSuspended(wrapper as Component)
  return result
}
