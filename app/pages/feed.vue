<script setup lang="ts">
import type { Hit, Trap } from '~~/server/utils/types'

const { data: hits, refresh } = await useFetch<Hit[]>('/api/hits')
const { data: traps } = await useFetch<Trap[]>('/api/traps')
const { relTime, absTime, geoLabel, uaLabel, flagIcon } = useFormat()

const trapName = (id: string) => traps.value?.find(t => t.id === id)?.name || 'unknown trap'

// Live: new visitors stream in instantly, no polling.
useLiveEvents((e) => {
  if (e.type === 'hit') {
    const list = hits.value ? [...hits.value] : []
    if (!list.some((h) => h.id === e.data.id)) list.unshift(e.data)
    hits.value = list.slice(0, 200)
  } else if (e.type === 'trap:created' || e.type === 'trap:updated') {
    // keep the trap name lookup fresh
    const list = traps.value ? [...traps.value] : []
    const i = list.findIndex((t) => t.id === e.data.id)
    if (i === -1) list.push(e.data)
    else list[i] = e.data
    traps.value = list
  } else if (e.type === 'trap:deleted') {
    traps.value = (traps.value || []).filter((t) => t.id !== e.data.id)
  }
})
</script>

<template>
  <div class="container page">
    <div class="between">
      <div>
        <h1>Live <span class="accent">feed</span></h1>
        <p class="lead">The most recent visitors across all your traps — streamed in live as they happen.</p>
      </div>
      <button class="btn ghost" @click="refresh()"><Icon name="lucide:refresh-cw" /> Refresh</button>
    </div>

    <div v-if="!hits || hits.length === 0" class="panel" style="margin-top:26px">
      <div class="empty">
        <div class="big"><Icon name="lucide:radar" /></div>
        <h3>All quiet</h3>
        <div>Nothing has been caught yet. Plant a trap link and keep this page open.</div>
      </div>
    </div>

    <div v-else class="panel table-wrap" style="margin-top:26px">
      <table>
        <thead>
          <tr><th>When</th><th>Trap</th><th>IP</th><th>Location</th><th>Client</th><th>Verdict</th></tr>
        </thead>
        <tbody>
          <tr v-for="h in hits" :key="h.id" class="clickable" @click="navigateTo(`/traps/${h.trapId}`)">
            <td :title="absTime(h.ts)" data-allow-mismatch>{{ relTime(h.ts) }}</td>
            <td><span style="font-weight:600">{{ trapName(h.trapId) }}</span></td>
            <td class="code">{{ h.ip }}</td>
            <td><span class="geo-cell"><Icon :name="flagIcon(h)" class="flag" /> {{ geoLabel(h) }}</span></td>
            <td>{{ uaLabel(h) }}</td>
            <td>
              <span class="badge" :class="h.isBot ? 'bot' : 'human'">
                <Icon :name="h.isBot ? 'lucide:bot' : 'lucide:user-round'" /> {{ h.isBot ? 'bot' : 'human' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
