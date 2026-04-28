<template>
  <section class="mt-4 grid gap-4 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm md:grid-cols-[minmax(180px,260px)_1fr]">
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Date</legend>
      <input v-model="dateModel" class="input w-full" type="date" @change="$emit('refresh')">
    </fieldset>

    <div class="stats stats-vertical border border-base-300 shadow-none sm:stats-horizontal">
      <div class="stat">
        <div class="stat-title font-bold">Total spent</div>
        <div class="stat-value text-primary">{{ formatCurrency(total) }}</div>
      </div>

      <div class="stat">
        <div class="stat-title font-bold">Entries</div>
        <div class="stat-value">{{ entryCount }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatCurrency } from '../utils/formatters'

defineProps<{
  entryCount: number
  total: number
}>()

defineEmits<{
  refresh: []
}>()

const dateModel = defineModel<string>('selectedDate', { required: true })
</script>
