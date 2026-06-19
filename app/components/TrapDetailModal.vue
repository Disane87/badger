<script setup lang="ts">
const props = defineProps<{
  open: boolean
  trapId: string | null
}>()

const emit = defineEmits<{ close: [] }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open && trapId"
        class="modal-overlay"
        @click.self="emit('close')"
        @keydown="onKeydown"
        tabindex="-1"
      >
        <div class="modal modal--wide" role="dialog" aria-modal="true" aria-label="Trap detail">
          <button class="modal-x modal-x--floating" aria-label="Close" @click="emit('close')">
            <Icon name="lucide:x" />
          </button>
          <div class="modal-body modal-body--detail">
            <Suspense>
              <TrapDetailBody :id="trapId" @gone="emit('close')" />
              <template #fallback>
                <div class="empty" style="padding: 60px 0;">
                  <div class="big"><Icon name="lucide:loader-circle" class="spin" /></div>
                  <div class="faint">Loading trap detail…</div>
                </div>
              </template>
            </Suspense>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
