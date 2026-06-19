<script setup lang="ts">
/**
 * Brand mark. Stylized badger head: warm honey square background, dark badger
 * silhouette with the iconic white face stripe and two black eye patches.
 * Used in the topbar; the same artwork lives in /public/favicon.svg for the
 * browser tab and in landing/assets/favicon.svg for the marketing site.
 */
withDefaults(defineProps<{ size?: number | string }>(), { size: 28 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="badger-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd166" />
        <stop offset="1" stop-color="#f2a007" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#badger-bg)" />
    <!-- ears -->
    <path d="M16 18 L20 14 L24 22 Z" fill="#1c160e" />
    <path d="M48 18 L44 14 L40 22 Z" fill="#1c160e" />
    <!-- head silhouette -->
    <path
      d="M32 16 C 19 16, 14 26, 14 36 C 14 47, 22 54, 32 54 C 42 54, 50 47, 50 36 C 50 26, 45 16, 32 16 Z"
      fill="#1c160e"
    />
    <!-- white face stripe from crown to snout -->
    <path
      d="M32 17 C 29 22, 28.5 28, 28.5 34 C 28.5 39, 29.5 44, 32 50 C 34.5 44, 35.5 39, 35.5 34 C 35.5 28, 35 22, 32 17 Z"
      fill="#fffaf0"
    />
    <!-- left eye -->
    <ellipse cx="22.5" cy="33" rx="2" ry="2.6" fill="#fffaf0" />
    <circle cx="22.5" cy="33.6" r="1" fill="#1c160e" />
    <!-- right eye -->
    <ellipse cx="41.5" cy="33" rx="2" ry="2.6" fill="#fffaf0" />
    <circle cx="41.5" cy="33.6" r="1" fill="#1c160e" />
    <!-- snout -->
    <ellipse cx="32" cy="46" rx="3.2" ry="2.2" fill="#1c160e" />
  </svg>
</template>
