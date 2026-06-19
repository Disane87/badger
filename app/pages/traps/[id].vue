<script setup lang="ts">
import type { Hit, Trap } from '~~/server/utils/types'
import { trapUrls, usePublicOrigin } from '~/composables/useFormat'

const route = useRoute()
const id = route.params.id as string
const { data, refresh, pending } = await useFetch<{ trap: Trap; hits: Hit[] }>(`/api/traps/${id}`)
const { relTime, absTime, geoLabel, uaLabel, flagIcon, hasCoords, mapUrl } = useFormat()

const origin = usePublicOrigin()
const expanded = ref<string | null>(null)
const toast = ref('')
const refreshingOg = ref(false)

const TYPE_ICON: Record<string, string> = {
  pixel: 'lucide:eye',
  redirect: 'lucide:corner-up-right',
  clone: 'lucide:copy',
  custom: 'lucide:image',
  decoy: 'lucide:venetian-mask'
}
const typeIcon = (t: string) => TYPE_ICON[t] || 'lucide:link'

// Pull a couple of common OG fields out for the preview card.
const og = computed(() => data.value?.trap.ogData)
function ogValue(...keys: string[]): string | undefined {
  const tags = og.value?.tags || []
  for (const k of keys) {
    const t = tags.find((t) => t.key.toLowerCase() === k.toLowerCase())
    if (t?.content) return t.content
  }
  return undefined
}
function hostOf(url?: string): string {
  if (!url) return ''
  try { return new URL(url).host } catch { return '' }
}
const ogPreview = computed(() => ({
  title: ogValue('og:title', 'twitter:title') || og.value?.title,
  description: ogValue('og:description', 'twitter:description', 'description'),
  image: ogValue('og:image', 'twitter:image'),
  site: ogValue('og:site_name') || hostOf(og.value?.finalUrl)
}))

async function refreshOg() {
  refreshingOg.value = true
  try {
    await $fetch(`/api/traps/${id}/refresh-og`, { method: 'POST' })
    await refresh()
    flash('Preview refreshed')
  } catch (e: any) {
    flash(e?.data?.statusMessage || 'Refresh failed')
  } finally {
    refreshingOg.value = false
  }
}

const humans = computed(() => (data.value?.hits || []).filter(h => !h.isBot).length)
const bots = computed(() => (data.value?.hits || []).filter(h => h.isBot).length)
const uniqueIps = computed(() => new Set((data.value?.hits || []).map(h => h.ip)).size)

function toggle(hitId: string) {
  expanded.value = expanded.value === hitId ? null : hitId
}

async function copyUrl() {
  if (!data.value) return
  await navigator.clipboard.writeText(trapUrls(data.value.trap.slug, data.value.trap.type, origin.value))
  flash('URL copied')
}

let toastTimer: any
function flash(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

// Auto-refresh every 10s while viewing
let poll: any
onMounted(() => { poll = setInterval(() => refresh(), 10000) })
onBeforeUnmount(() => clearInterval(poll))
</script>

<template>
  <div class="container page" v-if="data">
    <NuxtLink to="/" class="back"><Icon name="lucide:arrow-left" /> Back to traps</NuxtLink>

    <div class="between" style="margin-top: 14px;">
      <div>
        <h1>{{ data.trap.name }}</h1>
        <p class="muted" v-if="data.trap.note">{{ data.trap.note }}</p>
      </div>
      <span class="badge" :class="data.trap.type"><Icon :name="typeIcon(data.trap.type)" /> {{ data.trap.type }}</span>
    </div>

    <div class="panel pad" style="margin-top: 20px;">
      <label>Tracking URL — plant this where you want to detect access</label>
      <div class="url" style="font-size:13px">
        <span class="u">{{ trapUrls(data.trap.slug, data.trap.type, origin) }}</span>
        <button class="copy" @click="copyUrl"><Icon name="lucide:copy" /></button>
      </div>
      <div v-if="data.trap.type === 'pixel'" class="faint code" style="margin-top:12px">
        Embed: &lt;img src="{{ trapUrls(data.trap.slug, 'pixel', origin) }}" width="1" height="1" /&gt;
      </div>
      <div v-if="data.trap.type === 'redirect'" class="faint" style="margin-top:12px;display:flex;align-items:center;gap:7px">
        <Icon name="lucide:corner-up-right" /> Forwards to: <span class="code">{{ data.trap.target }}</span>
      </div>
      <div v-if="data.trap.type === 'clone'" class="faint" style="margin-top:12px;display:flex;align-items:center;gap:7px">
        <Icon name="lucide:copy" /> Clones preview of &amp; forwards to: <span class="code">{{ data.trap.target }}</span>
      </div>
      <div v-if="data.trap.type === 'custom' && data.trap.humanAction === 'redirect'" class="faint" style="margin-top:12px;display:flex;align-items:center;gap:7px">
        <Icon name="lucide:corner-up-right" /> Humans are forwarded to: <span class="code">{{ data.trap.target }}</span>
      </div>
      <div v-if="data.trap.type === 'custom' && data.trap.humanAction === 'html'" class="faint" style="margin-top:12px;display:flex;align-items:center;gap:7px">
        <Icon name="lucide:code" /> Humans see your custom HTML page
      </div>
    </div>

    <!-- link preview (clone = fetched, custom = authored) -->
    <div v-if="og" class="panel pad" style="margin-top: 20px;">
      <div class="between" style="margin-bottom: 14px;">
        <label style="margin:0">Link preview — what Slack, Discord, X &amp; co. will show</label>
        <button v-if="data.trap.type === 'clone'" class="btn ghost sm" :disabled="refreshingOg" @click="refreshOg">
          <Icon name="lucide:refresh-cw" :class="{ spin: refreshingOg }" /> {{ refreshingOg ? 'Refreshing…' : 'Refresh preview' }}
        </button>
      </div>

      <p v-if="og.error" class="form-error"><Icon name="lucide:triangle-alert" /> Clone failed: {{ og.error }}</p>

      <div v-if="!og.error" class="og-card">
        <img v-if="ogPreview.image" :src="ogPreview.image" alt="preview" class="og-img" referrerpolicy="no-referrer" />
        <div v-else class="og-img og-img--empty"><Icon name="lucide:image" /></div>
        <div class="og-body">
          <div class="og-site">{{ ogPreview.site }}</div>
          <div class="og-title">{{ ogPreview.title || 'Untitled' }}</div>
          <div class="og-desc">{{ ogPreview.description || '—' }}</div>
        </div>
      </div>

      <details v-if="og.tags.length" style="margin-top: 14px;">
        <summary data-allow-mismatch>Preview tags ({{ og.tags.length }}) · {{ relTime(og.fetchedAt) }}</summary>
        <div class="headers-box">{{ og.tags.map(t => `<meta ${t.attr}="${t.key}" content="${t.content}">`).join('\n') }}</div>
      </details>
    </div>

    <div class="stat-grid" style="margin-top: 20px;">
      <div class="stat"><div class="ico"><Icon name="lucide:target" /></div><div class="n accent">{{ data.hits.length }}</div><div class="l">Total hits</div></div>
      <div class="stat"><div class="ico"><Icon name="lucide:fingerprint" /></div><div class="n">{{ uniqueIps }}</div><div class="l">Unique IPs</div></div>
      <div class="stat"><div class="ico"><Icon name="lucide:user-round" /></div><div class="n mint">{{ humans }}</div><div class="l">Likely humans</div></div>
      <div class="stat"><div class="ico"><Icon name="lucide:bot" /></div><div class="n coral">{{ bots }}</div><div class="l">Likely bots</div></div>
    </div>

    <div class="section-title">
      Hits
      <span v-if="pending" class="faint" style="font-weight:500;text-transform:none;letter-spacing:0;font-family:var(--sans)">refreshing…</span>
    </div>

    <div v-if="data.hits.length === 0" class="panel">
      <div class="empty">
        <div class="big"><Icon name="lucide:satellite-dish" /></div>
        <h3>Waiting for the first visitor</h3>
        <div>Once someone opens the URL, everything we learn about them shows up here.</div>
      </div>
    </div>

    <div v-else class="panel table-wrap">
      <table>
        <thead>
          <tr><th>When</th><th>IP</th><th>Location</th><th>Client</th><th>Verdict</th></tr>
        </thead>
        <tbody>
          <template v-for="h in data.hits" :key="h.id">
            <tr class="clickable" @click="toggle(h.id)">
              <td :title="absTime(h.ts)" data-allow-mismatch>{{ relTime(h.ts) }}</td>
              <td class="code">{{ h.ip }}</td>
              <td><span class="geo-cell"><Icon :name="flagIcon(h)" class="flag" /> {{ geoLabel(h) }}</span></td>
              <td>{{ uaLabel(h) }}</td>
              <td>
                <span class="badge" :class="h.isBot ? 'bot' : 'human'">
                  <Icon :name="h.isBot ? 'lucide:bot' : 'lucide:user-round'" /> {{ h.isBot ? 'bot' : 'human' }}
                </span>
              </td>
            </tr>
            <tr v-if="expanded === h.id">
              <td colspan="5" style="background: var(--surface-2);">
                <div v-if="hasCoords(h)" class="hit-map">
                  <iframe :src="mapUrl(h)" title="Hit location" loading="lazy"></iframe>
                  <div class="hit-map-pill">
                    <Icon :name="flagIcon(h)" class="flag" />
                    {{ geoLabel(h) }}<template v-if="h.geo?.isp"> · {{ h.geo.isp }}</template>
                  </div>
                </div>
                <div class="row" style="gap: 32px; padding: 8px 4px 16px;">
                  <dl class="kv" style="flex:1; min-width: 280px;">
                    <dt>Timestamp</dt><dd>{{ absTime(h.ts) }}</dd>
                    <dt>Method / Path</dt><dd>{{ h.method }} {{ h.path }}</dd>
                    <dt>IP chain</dt><dd>{{ h.ipChain.join(' → ') }}</dd>
                    <dt>Referer</dt><dd>{{ h.referer || '—' }}</dd>
                    <dt>Accept-Language</dt><dd>{{ h.acceptLanguage || '—' }}</dd>
                    <dt>User-Agent</dt><dd>{{ h.userAgent || '—' }}</dd>
                    <dt v-if="h.botReason">Bot reason</dt><dd v-if="h.botReason" style="color:var(--coral)">{{ h.botReason }}</dd>
                  </dl>
                  <dl class="kv" style="flex:1; min-width: 280px;">
                    <dt>Browser</dt><dd>{{ [h.ua.browser, h.ua.browserVersion].filter(Boolean).join(' ') || '—' }}</dd>
                    <dt>OS</dt><dd>{{ [h.ua.os, h.ua.osVersion].filter(Boolean).join(' ') || '—' }}</dd>
                    <dt>Device</dt><dd>{{ h.ua.device || h.ua.deviceType || '—' }}</dd>
                    <dt>Engine</dt><dd>{{ h.ua.engine || '—' }}</dd>
                    <dt>Country</dt><dd>{{ h.geo?.country || '—' }} {{ h.geo?.countryCode ? `(${h.geo.countryCode})` : '' }}</dd>
                    <dt>City / Region</dt><dd>{{ [h.geo?.city, h.geo?.region].filter(Boolean).join(', ') || '—' }}</dd>
                    <dt>ISP / Org</dt><dd>{{ [h.geo?.isp, h.geo?.org].filter(Boolean).join(' / ') || '—' }}</dd>
                    <dt>ASN</dt><dd>{{ h.geo?.asn || '—' }}</dd>
                  </dl>
                </div>
                <details style="padding: 0 4px 8px;">
                  <summary>Raw request headers ({{ Object.keys(h.headers).length }})</summary>
                  <div class="headers-box">{{ Object.entries(h.headers).map(([k, v]) => `${k}: ${v}`).join('\n') }}</div>
                </details>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="toast"><Icon name="lucide:check" /> {{ toast }}</div>
    </Transition>
  </div>
</template>
