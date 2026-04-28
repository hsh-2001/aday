<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase text-primary">Daily Usage</p>
        <h2 class="mt-1 text-xl font-black">{{ dailyUsage?.date || selectedDate }}</h2>
      </div>
      <button type="button" class="btn btn-outline btn-sm" :disabled="loading" @click="$emit('refresh')">
        <span v-if="loading" class="loading loading-spinner loading-xs" />
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <ul v-if="dailyUsage?.entries.length" class="grid gap-3">
      <li v-for="entry in dailyUsage.entries" :key="entry.id" class="rounded-box border border-base-300 bg-base-200/45 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <strong class="text-base font-black">{{ entry.category }}</strong>
              <span class="badge badge-ghost">{{ formatDateTime(entry.spentAt) }}</span>
            </div>
            <p v-if="entry.note" class="mt-2 text-sm leading-6 text-base-content/70">{{ entry.note }}</p>
          </div>
          <div class="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
            <strong class="text-lg font-black text-primary">{{ formatCurrency(entry.amount) }}</strong>
            <button type="button" class="btn btn-error btn-outline btn-xs" @click="$emit('delete', entry.id)">Delete</button>
          </div>
        </div>
      </li>
    </ul>

    <div v-else class="rounded-box border border-dashed border-base-300 bg-base-200/45 p-8 text-center text-base-content/70">
      <span v-if="loading" class="loading loading-spinner loading-md" />
      <p class="mt-2">{{ loading ? 'Loading entries...' : 'No spending recorded for this date.' }}</p>
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
</script>
