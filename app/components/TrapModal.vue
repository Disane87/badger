<script setup lang="ts">
import type { Trap } from '~~/server/utils/types'
import { usePublicOrigin } from '~/composables/useFormat'

const props = defineProps<{
  open: boolean
  /** When set, the modal edits this trap instead of creating a new one. */
  trap?: Trap | null
}>()

const emit = defineEmits<{
  close: []
  saved: [trap: Trap]
}>()

const origin = usePublicOrigin()
const host = computed(() => {
  try { return origin.value ? new URL(origin.value).host : '—' } catch { return '—' }
})

const isEdit = computed(() => !!props.trap)
const submitting = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  type: 'pixel' as Trap['type'],
  target: '',
  note: '',
  slug: '',
  // custom preview
  title: '',
  description: '',
  image: '',
  siteName: '',
  humanAction: 'redirect' as 'redirect' | 'html',
  bodyHtml: ''
})

const needsTarget = computed(() => form.type === 'redirect' || form.type === 'clone')

function hydrate(trap?: Trap | null) {
  error.value = ''
  if (trap) {
    form.name = trap.name
    form.type = trap.type
    form.target = trap.target || ''
    form.note = trap.note || ''
    form.slug = trap.slug
    form.title = trap.custom?.title || ''
    form.description = trap.custom?.description || ''
    form.image = trap.custom?.image || ''
    form.siteName = trap.custom?.siteName || ''
    form.humanAction = trap.humanAction || 'redirect'
    form.bodyHtml = trap.bodyHtml || ''
  } else {
    form.name = ''
    form.type = 'pixel'
    form.target = ''
    form.note = ''
    form.slug = ''
    form.title = ''
    form.description = ''
    form.image = ''
    form.siteName = ''
    form.humanAction = 'redirect'
    form.bodyHtml = ''
  }
}

// Re-seed the form whenever the modal opens (fresh for create, populated for edit).
watch(() => props.open, (open) => {
  if (open) hydrate(props.trap)
})

function validate(): boolean {
  error.value = ''
  if (!form.name.trim()) { error.value = 'Name is required'; return false }
  if (needsTarget.value && !/^https?:\/\//i.test(form.target)) {
    error.value = 'This trap type needs a valid http(s) target URL'
    return false
  }
  if (form.type === 'custom') {
    if (!form.title.trim() && !form.description.trim() && !form.image.trim()) {
      error.value = 'Add at least a preview title, description or image'
      return false
    }
    if (form.humanAction === 'redirect' && !/^https?:\/\//i.test(form.target)) {
      error.value = 'Redirect action needs a valid http(s) target URL'
      return false
    }
    if (form.humanAction === 'html' && !form.bodyHtml.trim()) {
      error.value = 'HTML action needs some custom HTML to show'
      return false
    }
  }
  return true
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    let trap: Trap
    if (isEdit.value && props.trap) {
      // type & slug are immutable server-side — only send mutable fields.
      trap = await $fetch<Trap>(`/api/traps/${props.trap.id}`, {
        method: 'PATCH',
        body: {
          name: form.name,
          target: form.target,
          note: form.note,
          title: form.title,
          description: form.description,
          image: form.image,
          siteName: form.siteName,
          humanAction: form.humanAction,
          bodyHtml: form.bodyHtml
        }
      })
    } else {
      trap = await $fetch<Trap>('/api/traps', { method: 'POST', body: { ...form } })
    }
    emit('saved', trap)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Something went wrong'
  } finally {
    submitting.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-overlay" @click.self="emit('close')" @keydown="onKeydown">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <h2>{{ isEdit ? 'Edit trap' : 'Set a new trap' }}</h2>
            <button class="modal-x" aria-label="Close" @click="emit('close')"><Icon name="lucide:x" /></button>
          </div>

          <div class="modal-body">
            <div class="field">
              <label>Name <span class="faint">(just for you)</span></label>
              <input v-model="form.name" autofocus placeholder="e.g. Q3-Budget.pdf shared with vendor X" />
            </div>
            <div class="field-row">
              <div class="field">
                <label>What should it do?</label>
                <select v-model="form.type" :disabled="isEdit">
                  <option value="pixel">Tracking pixel — invisible 1×1 image for emails/docs</option>
                  <option value="redirect">Redirect link — logs, then forwards to a real URL</option>
                  <option value="clone">Clone &amp; redirect — copies a target's link preview, then forwards</option>
                  <option value="custom">Custom preview — design your own fake link preview</option>
                  <option value="decoy">Decoy page — logs, then shows a friendly "loading" page</option>
                </select>
                <div v-if="isEdit" class="faint" style="font-size:12.5px;margin-top:7px">
                  Type &amp; URL stay fixed once a trap is live.
                </div>
              </div>
              <div class="field">
                <label>Custom slug <span class="faint">(optional)</span></label>
                <input v-model="form.slug" :disabled="isEdit" placeholder="auto from name" />
              </div>
            </div>
            <div v-if="needsTarget" class="field">
              <label>{{ form.type === 'clone' ? 'Target to clone & forward to' : 'Redirect target' }}</label>
              <input v-model="form.target" placeholder="https://real-destination.example.com/login" />
              <div v-if="form.type === 'clone'" class="faint" style="font-size:13px;margin-top:8px">
                Badger fetches this URL's OpenGraph/Twitter preview so the trap link looks identical when shared.
              </div>
            </div>

            <!-- custom preview builder -->
            <template v-if="form.type === 'custom'">
              <div class="builder">
                <div class="builder-fields">
                  <div class="field">
                    <label>Preview title</label>
                    <input v-model="form.title" placeholder="Shared document · Q3 Budget" />
                  </div>
                  <div class="field">
                    <label>Preview description</label>
                    <textarea v-model="form.description" rows="2" placeholder="You have been granted access to this confidential file." />
                  </div>
                  <div class="field">
                    <label>Preview image URL</label>
                    <input v-model="form.image" placeholder="https://…/cover.png" />
                  </div>
                  <div class="field">
                    <label>Site name <span class="faint">(optional)</span></label>
                    <input v-model="form.siteName" placeholder="Google Drive" />
                  </div>
                </div>
                <div class="builder-preview">
                  <label>Live preview</label>
                  <div class="og-card">
                    <img v-if="form.image" :src="form.image" alt="preview" class="og-img" referrerpolicy="no-referrer" />
                    <div v-else class="og-img og-img--empty"><Icon name="lucide:image" /></div>
                    <div class="og-body">
                      <div class="og-site">{{ form.siteName || host }}</div>
                      <div class="og-title">{{ form.title || 'Your preview title' }}</div>
                      <div class="og-desc">{{ form.description || 'Your preview description shows up here.' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field">
                <label>When a human opens the link…</label>
                <div class="seg">
                  <button type="button" class="seg-btn" :class="{ on: form.humanAction === 'redirect' }" @click="form.humanAction = 'redirect'">
                    <Icon name="lucide:corner-up-right" /> Redirect them
                  </button>
                  <button type="button" class="seg-btn" :class="{ on: form.humanAction === 'html' }" @click="form.humanAction = 'html'">
                    <Icon name="lucide:code" /> Show custom HTML
                  </button>
                </div>
              </div>
              <div v-if="form.humanAction === 'redirect'" class="field">
                <label>Redirect target</label>
                <input v-model="form.target" placeholder="https://real-destination.example.com/login" />
              </div>
              <div v-else class="field">
                <label>Custom HTML page</label>
                <textarea v-model="form.bodyHtml" rows="6" class="mono" placeholder="<h1>Access granted</h1>&#10;<p>Loading your document…</p>" />
                <div class="faint" style="font-size:13px;margin-top:8px">
                  Shown to real visitors. Unfurlers still see the preview above. Raw HTML — it's your own content.
                </div>
              </div>
            </template>

            <div class="field">
              <label>Note <span class="faint">— where did you plant it?</span></label>
              <textarea v-model="form.note" rows="2" placeholder="Pasted into the leaked-credentials doc on the test box" />
            </div>
            <p v-if="error" class="form-error"><Icon name="lucide:triangle-alert" /> {{ error }}</p>
          </div>

          <div class="modal-foot">
            <button class="btn ghost" @click="emit('close')">Cancel</button>
            <button class="btn" :disabled="submitting" @click="submit">
              <Icon :name="isEdit ? 'lucide:save' : 'lucide:plus'" />
              {{ submitting ? (isEdit ? 'Saving…' : 'Setting trap…') : (isEdit ? 'Save changes' : 'Create trap') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
