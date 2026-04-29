<template>
  <section class="grid grid-cols-1 gap-6 md:grid-cols-3">
    <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <p class="text-sm font-medium text-slate-500">Total Balance</p>
      <h2 class="mt-1 text-3xl font-bold text-slate-900">{{ formatCurrency(-primaryTotal.total, primaryTotal.currency) }}</h2>
      <div class="mt-4 flex w-fit items-center gap-2 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
        <AppIcon class="h-3 w-3" name="trending-up" />
        {{ entryCount }} entries today
      </div>
    </div>

    <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center gap-3">
        <div class="rounded-lg bg-emerald-100 p-2 text-emerald-600">
          <AppIcon class="h-5 w-5" name="arrow-up-right" />
        </div>
        <p class="text-sm font-medium text-slate-500">Income</p>
      </div>
      <h2 class="text-2xl font-bold text-emerald-600">{{ formatCurrency(0, primaryTotal.currency) }}</h2>
    </div>

    <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center gap-3">
        <div class="rounded-lg bg-rose-100 p-2 text-rose-600">
          <AppIcon class="h-5 w-5" name="arrow-down-left" />
        </div>
        <p class="text-sm font-medium text-slate-500">Expenses</p>
      </div>
      <div class="space-y-1">
        <h2
          v-for="total in displayTotals"
          :key="total.currency"
          class="text-2xl font-bold text-rose-600"
        >
          {{ formatCurrency(total.total, total.currency) }}
        </h2>
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

defineModel<string>('selectedDate', { required: true })
const displayTotals = computed(() => {
  if (props.totals.length) {
    return props.totals
  }

  return [{ currency: 'USD', total: 0 }]
})
const primaryTotal = computed(() => displayTotals.value[0])
</script>
