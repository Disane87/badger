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

// modal state — create when editing is null, edit when set
const modalOpen = ref(false)
const editing = ref<Trap | null>(null)
const detailOpen = ref(false)
const detailTrapId = ref<string | null>(null)
const toast = ref('')

const TYPE_META: Record<string, { icon: string; label: string }> = {
  pixel: { icon: 'lucide:eye', label: 'Tracking pixel' },
  redirect: { icon: 'lucide:corner-up-right', label: 'Redirect link' },
  clone: { icon: 'lucide:copy', label: 'Clone & redirect' },
  custom: { icon: 'lucide:image', label: 'Custom preview' },
  decoy: { icon: 'lucide:venetian-mask', label: 'Decoy page' }
}
const typeIcon = (t: string) => TYPE_META[t]?.icon || 'lucide:link'

function openCreate() {
  editing.value = null
  modalOpen.value = true
}
function openEdit(t: Trap, ev: Event) {
  ev.stopPropagation()
  editing.value = t
  modalOpen.value = true
}
function openDetail(t: Trap) {
  detailTrapId.value = t.id
  detailOpen.value = true
}
function closeDetail() {
  detailOpen.value = false
  // Keep the id around for the leave transition; clear after.
  setTimeout(() => { detailTrapId.value = null }, 250)
}

/** Replace-or-insert a trap in the local list, keeping newest-first order. */
function upsertTrap(t: Trap) {
  const list = traps.value ? [...traps.value] : []
  const i = list.findIndex((x) => x.id === t.id)
  if (i === -1) list.unshift(t)
  else list[i] = t
  list.sort((a, b) => b.createdAt - a.createdAt)
  traps.value = list
}

function onSaved(t: Trap) {
  upsertTrap(t)
  modalOpen.value = false
  flash(editing.value ? 'Trap updated' : 'Trap created')
  editing.value = null
}

async function remove(t: Trap, ev: Event) {
  ev.stopPropagation()
  if (!confirm(`Delete trap "${t.name}" and all its hits?`)) return
  // optimistic; the SSE 'trap:deleted' will confirm for every other client
  traps.value = (traps.value || []).filter((x) => x.id !== t.id)
  await $fetch(`/api/traps/${t.id}`, { method: 'DELETE' })
  flash('Trap deleted')
}

async function copyUrl(t: Trap, ev: Event) {
  ev.stopPropagation()
  const url = trapUrls(t.slug, t.type, origin.value)
  await navigator.clipboard.writeText(url)
  flash('URL copied')
}

// Live reactivity: traps appear, update (hit counts!) and disappear in real time.
useLiveEvents((e) => {
  if (e.type === 'trap:created' || e.type === 'trap:updated') {
    upsertTrap(e.data)
  } else if (e.type === 'trap:deleted') {
    traps.value = (traps.value || []).filter((x) => x.id !== e.data.id)
  }
})

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
      <button class="btn" @click="openCreate">
        <Icon name="lucide:plus" /> New trap
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
        @click="openDetail(t)"
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
          <div class="row" style="gap:8px; align-items:center;">
            <span class="faint" style="font-size:12.5px" data-allow-mismatch>{{ relTime(t.createdAt) }}</span>
            <button class="btn ghost sm" title="Edit trap" @click="openEdit(t, $event)"><Icon name="lucide:pencil" /></button>
            <button class="btn danger sm" title="Delete trap" @click="remove(t, $event)"><Icon name="lucide:trash-2" /></button>
          </div>
        </div>
      </article>
    </div>

    <TrapModal :open="modalOpen" :trap="editing" @close="modalOpen = false" @saved="onSaved" />

    <TrapDetailModal :open="detailOpen" :trap-id="detailTrapId" @close="closeDetail" />

    <Transition name="fade">
      <div v-if="toast" class="toast"><Icon name="lucide:check" /> {{ toast }}</div>
    </Transition>
  </div>
</template>
