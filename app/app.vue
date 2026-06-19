<template>
  <div>
    <header class="topbar">
      <div class="container inner">
        <NuxtLink to="/" class="brand">
          <span class="logo"><Icon name="lucide:hexagon" /></span>
          <span class="name">hon<b>.</b>ey</span>
          <span class="tag">HONEYPOT</span>
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
