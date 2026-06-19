<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <div class="container page">
    <NuxtLink to="/" class="back"><Icon name="lucide:arrow-left" /> Back to traps</NuxtLink>
    <div style="margin-top: 14px;">
      <TrapDetailBody :id="id" @gone="navigateTo('/')" />
    </div>
  </div>
</template>
