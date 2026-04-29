<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        ref="dialogRoot"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <button
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          type="button"
          aria-label="Close dialog"
          @click="requestClose"
        />

        <div class="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
            <div class="min-w-0">
              <h2 :id="titleId" class="text-xl font-bold text-slate-900">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-sm leading-6 text-slate-500">{{ description }}</p>
            </div>
            <button
              class="rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100"
              type="button"
              aria-label="Close dialog"
              @click="requestClose"
            >
              <AppIcon class="h-5 w-5" name="x" />
            </button>
          </div>

          <div class="p-6">
            <slot />
          </div>

          <div v-if="$slots.actions" class="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  closeDisabled?: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const open = defineModel<boolean>('open', { required: true })
const dialogRoot = ref<HTMLElement | null>(null)
const titleId = useId()

const requestClose = () => {
  if (props.closeDisabled) {
    return
  }

  open.value = false
  emit('close')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value) {
    requestClose()
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) {
    return
  }

  await nextTick()
  dialogRoot.value?.focus()
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
