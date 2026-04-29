<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Recent Transactions</h3>
        <p class="text-sm text-slate-500">{{ dailyUsage?.date || selectedDate }}</p>
      </div>
      <div class="flex gap-2">
        <button class="rounded-lg p-2 transition-colors hover:bg-slate-200" type="button" aria-label="Search transactions">
          <AppIcon class="h-4 w-4 text-slate-500" name="search" />
        </button>
        <button
          class="rounded-lg p-2 transition-colors hover:bg-slate-200 disabled:opacity-50"
          type="button"
          :disabled="loading"
          aria-label="Refresh transactions"
          @click="$emit('refresh')"
        >
          <AppIcon class="h-4 w-4 text-slate-500" name="filter" />
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <ul v-if="dailyUsage?.entries.length" class="divide-y divide-slate-50">
        <li
          v-for="entry in dailyUsage.entries"
          :key="entry.id"
          class="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50"
        >
          <div class="flex min-w-0 items-center gap-4">
            <div class="rounded-xl bg-slate-100 p-3 text-slate-600">
              <AppIcon class="h-5 w-5" :name="getCategoryIcon(entry.category)" />
            </div>
            <div class="min-w-0">
              <p class="truncate font-semibold text-slate-800">{{ entry.note || entry.category }}</p>
              <p class="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                <AppIcon class="h-3 w-3" name="calendar" />
                {{ formatDateTime(entry.spentAt) }} <span aria-hidden="true">•</span> {{ entry.category }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-3">
            <strong class="font-bold text-slate-900">-{{ formatCurrency(entry.amount, entry.currency) }}</strong>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-300 opacity-100 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Delete transaction"
              @click="$emit('delete', entry.id)"
            >
              <AppIcon class="h-4 w-4" name="trash" />
            </button>
          </div>
        </li>
      </ul>

      <div v-else class="p-12 text-center text-slate-400">
        {{ loading ? 'Loading transactions...' : 'No transactions yet.' }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DailyUsage } from '../types/api'
import { formatCurrency, formatDateTime } from '../utils/formatters'

defineProps<{
  dailyUsage: DailyUsage | null
  loading: boolean
  selectedDate: string
}>()

defineEmits<{
  delete: [id: string]
  refresh: []
}>()

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'work':
      return 'trending-up'
    case 'food':
      return 'search'
    case 'housing':
    case 'rent':
      return 'home'
    case 'investment':
      return 'pie-chart'
    default:
      return 'credit-card'
  }
}
</script>
