<script setup lang="ts">
import type { Trap } from '~~/server/utils/types'
import { trapUrls, usePublicOrigin } from '~/composables/useFormat'

const { data: traps, refresh } = await useFetch<Trap[]>('/api/traps')
const { relTime } = useFormat()

const origin = usePublicOrigin()
const host = computed(() => {
  try { return origin.value ? new URL(origin.value).host : '—' } catch { return '—' }
})
const totalHits = computed(() => (traps.value || []).reduce((a, t) => a + (t.hitCount || 0), 0))

const showForm = ref(false)
const submitting = ref(false)
const error = ref('')
const toast = ref('')

const form = reactive({
  name: '',
  type: 'pixel' as 'pixel' | 'redirect' | 'decoy' | 'clone' | 'custom',
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

const TYPE_META: Record<string, { icon: string; label: string }> = {
  pixel: { icon: 'lucide:eye', label: 'Tracking pixel' },
  redirect: { icon: 'lucide:corner-up-right', label: 'Redirect link' },
  clone: { icon: 'lucide:copy', label: 'Clone & redirect' },
  custom: { icon: 'lucide:image', label: 'Custom preview' },
  decoy: { icon: 'lucide:venetian-mask', label: 'Decoy page' }
}
const typeIcon = (t: string) => TYPE_META[t]?.icon || 'lucide:link'

function resetForm() {
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
  error.value = ''
}

async function createTrap() {
  error.value = ''
  if (!form.name.trim()) { error.value = 'Name is required'; return }
  if (needsTarget.value && !/^https?:\/\//i.test(form.target)) {
    error.value = 'This trap type needs a valid http(s) target URL'
    return
  }
  if (form.type === 'custom') {
    if (!form.title.trim() && !form.description.trim() && !form.image.trim()) {
      error.value = 'Add at least a preview title, description or image'
      return
    }
    if (form.humanAction === 'redirect' && !/^https?:\/\//i.test(form.target)) {
      error.value = 'Redirect action needs a valid http(s) target URL'
      return
    }
    if (form.humanAction === 'html' && !form.bodyHtml.trim()) {
      error.value = 'HTML action needs some custom HTML to show'
      return
    }
  }
  submitting.value = true
  try {
    await $fetch('/api/traps', { method: 'POST', body: { ...form } })
    resetForm()
    showForm.value = false
    await refresh()
    flash('Trap created')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to create trap'
  } finally {
    submitting.value = false
  }
}

async function remove(t: Trap, ev: Event) {
  ev.stopPropagation()
  if (!confirm(`Delete trap "${t.name}" and all its hits?`)) return
  await $fetch(`/api/traps/${t.id}`, { method: 'DELETE' })
  await refresh()
  flash('Trap deleted')
}

async function copyUrl(t: Trap, ev: Event) {
  ev.stopPropagation()
  const url = trapUrls(t.slug, t.type, origin.value)
  await navigator.clipboard.writeText(url)
  flash('URL copied')
}

let toastTimer: any
function flash(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}
</script>

<template>
  <div class="container page">
    <div class="between">
      <div>
        <h1>Your <span class="accent">honey traps</span></h1>
        <p class="lead">Friendly-looking links that quietly note down everyone who opens them — and exactly how.</p>
      </div>
      <button class="btn" @click="showForm = !showForm">
        <Icon :name="showForm ? 'lucide:x' : 'lucide:plus'" /> {{ showForm ? 'Close' : 'New trap' }}
      </button>
    </div>

    <div class="stat-grid" style="margin-top: 28px;">
      <div class="stat">
        <div class="ico"><Icon name="lucide:layout-grid" /></div>
        <div class="n accent">{{ traps?.length || 0 }}</div>
        <div class="l">Active traps</div>
      </div>
      <div class="stat">
        <div class="ico"><Icon name="lucide:crosshair" /></div>
        <div class="n">{{ totalHits }}</div>
        <div class="l">Total hits caught</div>
      </div>
      <div class="stat">
        <div class="ico"><Icon name="lucide:zap" /></div>
        <div class="n mint">{{ (traps || []).filter(t => t.hitCount > 0).length }}</div>
        <div class="l">Traps triggered</div>
      </div>
      <div class="stat">
        <div class="ico"><Icon name="lucide:globe" /></div>
        <div class="n host">{{ host }}</div>
        <div class="l">Tracking host</div>
      </div>
    </div>

    <!-- create form -->
    <Transition name="fade">
      <div v-if="showForm" class="panel pad" style="margin-top: 24px;">
        <h2>Set a new trap</h2>
        <div class="field">
          <label>Name <span class="faint">(just for you)</span></label>
          <input v-model="form.name" placeholder="e.g. Q3-Budget.pdf shared with vendor X" @keyup.enter="createTrap" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>What should it do?</label>
            <select v-model="form.type">
              <option value="pixel">Tracking pixel — invisible 1×1 image for emails/docs</option>
              <option value="redirect">Redirect link — logs, then forwards to a real URL</option>
              <option value="clone">Clone &amp; redirect — copies a target's link preview, then forwards</option>
              <option value="custom">Custom preview — design your own fake link preview</option>
              <option value="decoy">Decoy page — logs, then shows a friendly "loading" page</option>
            </select>
          </div>
          <div class="field">
            <label>Custom slug <span class="faint">(optional)</span></label>
            <input v-model="form.slug" placeholder="auto from name" />
          </div>
        </div>
        <div v-if="needsTarget" class="field">
          <label>{{ form.type === 'clone' ? 'Target to clone & forward to' : 'Redirect target' }}</label>
          <input v-model="form.target" placeholder="https://real-destination.example.com/login" />
          <div v-if="form.type === 'clone'" class="faint" style="font-size:13px;margin-top:8px">
            On create, hon.ey fetches this URL's OpenGraph/Twitter preview so the trap link looks identical when shared.
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
                  <div class="og-site">{{ form.siteName || (host) }}</div>
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
        <button class="btn" :disabled="submitting" @click="createTrap">
          <Icon name="lucide:plus" /> {{ submitting ? 'Setting trap…' : 'Create trap' }}
        </button>
      </div>
    </Transition>

    <!-- list -->
    <div class="section-title">All traps</div>
    <div v-if="!traps || traps.length === 0" class="panel">
      <div class="empty">
        <div class="big"><Icon name="lucide:inbox" /></div>
        <h3>No traps yet</h3>
        <div>Create your first one and plant the link somewhere you'd like to keep an eye on.</div>
      </div>
    </div>
    <div v-else class="trap-grid">
      <article
        v-for="(t, i) in traps"
        :key="t.id"
        class="trap-card"
        :style="{ animationDelay: i * 0.04 + 's' }"
        @click="navigateTo(`/traps/${t.id}`)"
      >
        <div class="head">
          <div class="title">{{ t.name }}</div>
          <span class="badge" :class="t.type"><Icon :name="typeIcon(t.type)" /> {{ t.type }}</span>
        </div>
        <div v-if="t.note" class="note">{{ t.note }}</div>
        <div class="url">
          <span class="u">{{ trapUrls(t.slug, t.type, origin) }}</span>
          <button class="copy" title="Copy URL" @click="copyUrl(t, $event)"><Icon name="lucide:copy" /></button>
        </div>
        <div class="foot">
          <span class="hit-pill" :class="{ live: t.hitCount > 0 }">
            <Icon :name="t.hitCount > 0 ? 'lucide:target' : 'lucide:minus'" /> {{ t.hitCount }} {{ t.hitCount === 1 ? 'hit' : 'hits' }}
          </span>
          <div class="row" style="gap:10px; align-items:center;">
            <span class="faint" style="font-size:12.5px" data-allow-mismatch>{{ relTime(t.createdAt) }}</span>
            <button class="btn danger sm" @click="remove(t, $event)"><Icon name="lucide:trash-2" /></button>
          </div>
        </div>
      </article>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="toast"><Icon name="lucide:check" /> {{ toast }}</div>
    </Transition>
  </div>
</template>
