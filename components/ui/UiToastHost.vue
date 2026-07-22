<template>
  <Teleport to="body">
    <Transition name="ui-toast">
      <div
        v-if="toast?.visible"
        class="ui-toast"
        role="status"
        aria-live="polite"
      >
        <p class="ui-toast__message">
          {{ toast.message }}
        </p>
        <div v-if="toast.actions.length" class="ui-toast__actions">
          <template v-for="(action, index) in toast.actions" :key="index">
            <a
              v-if="action.href"
              :href="action.href"
              class="ui-toast__action"
              :class="{ 'ui-toast__action_primary': index === 0 }"
              target="_blank"
              rel="noopener noreferrer"
              @click="onActionClick(action)"
            >
              {{ action.label }}
            </a>
            <button
              v-else
              type="button"
              class="ui-toast__action"
              :class="{ 'ui-toast__action_primary': index === 0 }"
              @click="onActionClick(action)"
            >
              {{ action.label }}
            </button>
          </template>
        </div>
        <button
          type="button"
          class="ui-toast__close"
          :aria-label="t('overlay.close')"
          @click="dismiss"
        >
          <UiIcon name="lucide:x" size="sm" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastAction } from '~/composables/useToast'

const { t } = useI18n()
const { toast, dismiss } = useToast()

function onActionClick(action: ToastAction) {
  action.onClick?.()
  dismiss()
}
</script>
