<template>
  <svg
    aria-hidden="true"
    class="inline-block"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    viewBox="0 0 24 24"
  >
    <template v-if="name === 'wallet'">
      <path d="M19 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
      <path d="M16 14h.01" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </template>
    <template v-else-if="name === 'x'">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </template>
    <template v-else-if="name === 'trending-up'">
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </template>
    <template v-else-if="name === 'arrow-up-right'">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </template>
    <template v-else-if="name === 'arrow-down-left'">
      <path d="M17 7 7 17" />
      <path d="M17 17H7V7" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </template>
    <template v-else-if="name === 'filter'">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </template>
    <template v-else-if="name === 'calendar'">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M3 10h18" />
    </template>
    <template v-else-if="name === 'home'">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </template>
    <template v-else-if="name === 'pie-chart'">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </template>
    <template v-else-if="name === 'credit-card'">
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>
