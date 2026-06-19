<script setup lang="ts">
import type { Hit, Trap } from '~~/server/utils/types'

const { data: hits, refresh } = await useFetch<Hit[]>('/api/hits')
const { data: traps } = await useFetch<Trap[]>('/api/traps')
const { relTime, absTime, geoLabel, uaLabel } = useFormat()

const trapName = (id: string) => traps.value?.find(t => t.id === id)?.name || 'unknown trap'

let poll: any
onMounted(() => { poll = setInterval(() => refresh(), 8000) })
onBeforeUnmount(() => clearInterval(poll))
</script>

<template>
  <div class="container page">
    <div class="between">
      <div>
        <h1>Live <span class="accent">feed</span></h1>
        <p class="lead">The most recent visitors across all your traps — refreshes itself every few seconds.</p>
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
            <td>{{ geoLabel(h) }}</td>
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
