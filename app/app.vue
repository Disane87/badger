<template>
  <div>
    <header class="topbar">
      <div class="container inner">
        <NuxtLink to="/" class="brand">
          <BadgerMark :size="30" class="logo-mark" />
          <span class="name">Badger</span>
          <span class="tag">TRACKER</span>
        </NuxtLink>
        <nav class="nav">
          <NuxtLink to="/"><Icon name="lucide:layout-grid" /> Traps</NuxtLink>
          <NuxtLink to="/feed"><Icon name="lucide:radio" /> Live&nbsp;Feed</NuxtLink>
        </nav>
      </div>
    </header>
    <main>
      <NuxtPage />
    </main>
  </div>
</template>
