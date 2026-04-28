<template>
  <section class="mt-4 grid gap-4 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm md:grid-cols-[minmax(180px,260px)_1fr]">
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Date</legend>
      <input v-model="dateModel" class="input w-full" type="date" @change="$emit('refresh')">
    </fieldset>

    <div class="stats stats-vertical border border-base-300 shadow-none sm:stats-horizontal">
      <div v-for="total in displayTotals" :key="total.currency" class="stat">
        <div class="stat-title font-bold">Total spent {{ total.currency }}</div>
        <div class="stat-value text-2xl text-primary sm:text-3xl">{{ formatCurrency(total.total, total.currency) }}</div>
      </div>

      <div class="stat">
        <div class="stat-title font-bold">Entries</div>
        <div class="stat-value">{{ entryCount }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CurrencyTotal } from '../types/api'
import { formatCurrency } from '../utils/formatters'

const props = defineProps<{
  entryCount: number
  totals: CurrencyTotal[]
}>()

defineEmits<{
  refresh: []
}>()

const dateModel = defineModel<string>('selectedDate', { required: true })
const displayTotals = computed(() => {
  if (props.totals.length) {
    return props.totals
  }

  return [{ currency: 'USD', total: 0 }]
})
</script>
