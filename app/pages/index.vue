<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <nav class="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="rounded-lg bg-indigo-600 p-2 text-white">
            <AppIcon class="h-5 w-5" name="wallet" />
          </div>
          <h1 class="text-xl font-bold tracking-tight">FinFlow</h1>
        </div>

        <div v-if="user" class="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            class="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-white shadow-md shadow-indigo-100 transition-colors hover:bg-indigo-700"
            @click="openEntryModal"
          >
            <AppIcon class="h-4 w-4" name="plus" />
            <span class="hidden font-medium sm:inline">Add Transaction</span>
          </button>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 text-sm font-bold text-slate-600 shadow-sm"
            :title="`Log out ${user.username}`"
            @click="logout"
          >
            {{ userInitial }}
          </button>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
      <AuthPanel
        v-if="!user"
        v-model:form="authForm"
        :error="errorMessage"
        :loading="isAuthLoading"
        :mode="authMode"
        @submit="submitAuth"
        @toggle-mode="toggleAuthMode"
      />

      <template v-else>
        <SummaryBand
          v-model:selected-date="selectedDate"
          :entry-count="dailyUsage?.entries.length || 0"
          :totals="dailyUsage?.totals || []"
          @refresh="loadDailyUsage"
        />

        <section class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <label class="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-100">
                <AppIcon class="h-4 w-4" name="calendar" />
                <input
                  v-model="selectedDate"
                  class="bg-transparent text-slate-700 outline-none"
                  type="date"
                  @change="loadDailyUsage"
                >
              </label>
            </div>

            <EntriesPanel
              :daily-usage="dailyUsage"
              :loading="isDailyLoading"
              :selected-date="selectedDate"
              @delete="requestDeleteEntry"
              @refresh="loadDailyUsage"
            />
          </div>

          <aside class="space-y-6">
            <div class="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
              <div class="absolute right-4 top-4 text-white/10">
                <AppIcon class="h-20 w-20" name="pie-chart" />
              </div>
              <h4 class="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Quick Analysis</h4>
              <p class="relative mb-6 text-sm leading-relaxed">
                You recorded
                <span class="font-bold text-rose-400">{{ dailyUsage?.entries.length || 0 }}</span>
                transactions for this day. Use categories to spot where spending is concentrated.
              </p>
              <button
                type="button"
                class="relative w-full rounded-xl bg-white/10 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
                @click="loadDailyUsage"
              >
                View Reports
              </button>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h4 class="mb-4 font-bold text-slate-900">Categories</h4>
              <div class="space-y-3">
                <div
                  v-for="category in categorySummaries"
                  :key="category.name"
                  class="group flex cursor-pointer items-center justify-between"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <div class="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    <span class="truncate text-sm text-slate-600 transition-colors group-hover:text-slate-900">
                      {{ category.name }}
                    </span>
                  </div>
                  <span class="text-xs font-bold text-slate-400">{{ category.count }} items</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <BaseDialog
          v-model:open="isEntryModalOpen"
          title="New Transaction"
          @close="closeEntryModal"
        >
          <EntryForm
            v-model:category-name="categoryName"
            v-model:form="entryForm"
            :categories="categories"
            :category-loading="isCategoryLoading"
            :currencies="currencyOptions"
            :error="errorMessage"
            :loading="isEntryLoading"
            @add-category="createCategory"
            @submit="submitEntry"
          />
        </BaseDialog>

        <BaseDialog
          v-model:open="isDeleteDialogOpen"
          :close-disabled="isDeletingEntry"
          title="Delete Transaction"
          description="This transaction will be permanently removed."
          @close="cancelDeleteEntry"
        >
          <div v-if="pendingDeleteEntry" class="rounded-2xl bg-slate-50 p-4">
            <p class="font-semibold text-slate-900">{{ pendingDeleteEntry.note || pendingDeleteEntry.category }}</p>
            <p class="mt-1 text-sm text-slate-500">
              {{ pendingDeleteEntry.category }} · {{ formatCurrency(pendingDeleteEntry.amount, pendingDeleteEntry.currency) }}
            </p>
          </div>
          <div v-if="errorMessage" class="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ errorMessage }}
          </div>

          <template #actions>
            <button
              type="button"
              class="rounded-full px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              :disabled="isDeletingEntry"
              @click="cancelDeleteEntry"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-rose-100 transition-colors hover:bg-rose-700 disabled:opacity-60"
              :disabled="isDeletingEntry || !pendingDeleteEntry"
              @click="confirmDeleteEntry"
            >
              {{ isDeletingEntry ? 'Deleting...' : 'Delete' }}
            </button>
          </template>
        </BaseDialog>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { MoneyEntry } from '../types/api'
import { formatCurrency } from '../utils/formatters'

const {
  authForm,
  authMode,
  categories,
  categoryName,
  currencyOptions,
  dailyUsage,
  entryForm,
  errorMessage,
  isAuthLoading,
  isCategoryLoading,
  isDailyLoading,
  isEntryLoading,
  selectedDate,
  user,
  createCategory,
  createEntry,
  deleteEntry,
  initializeSession,
  loadDailyUsage,
  logout,
  submitAuth,
  toggleAuthMode,
} = useMoneyTracker()

const isEntryModalOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isDeletingEntry = ref(false)
const pendingDeleteEntryId = ref<string | null>(null)

const userInitial = computed(() => user.value?.username.charAt(0).toUpperCase() || 'U')
const pendingDeleteEntry = computed<MoneyEntry | null>(() => {
  if (!pendingDeleteEntryId.value) {
    return null
  }

  return dailyUsage.value?.entries.find((entry) => entry.id === pendingDeleteEntryId.value) || null
})

const categorySummaries = computed(() => {
  const counts = new Map<string, number>()

  for (const category of categories.value) {
    counts.set(category, 0)
  }

  for (const entry of dailyUsage.value?.entries || []) {
    counts.set(entry.category, (counts.get(entry.category) || 0) + 1)
  }

  const summaries = Array.from(counts, ([name, count]) => ({ name, count }))

  return summaries.length ? summaries : [{ name: 'General', count: 0 }]
})

const openEntryModal = () => {
  errorMessage.value = ''
  isEntryModalOpen.value = true
}

const closeEntryModal = () => {
  isEntryModalOpen.value = false
}

const requestDeleteEntry = (id: string) => {
  errorMessage.value = ''
  pendingDeleteEntryId.value = id
  isDeleteDialogOpen.value = true
}

const cancelDeleteEntry = () => {
  if (isDeletingEntry.value) {
    return
  }

  isDeleteDialogOpen.value = false
  pendingDeleteEntryId.value = null
}

const confirmDeleteEntry = async () => {
  if (!pendingDeleteEntryId.value) {
    return
  }

  isDeletingEntry.value = true
  const deleted = await deleteEntry(pendingDeleteEntryId.value)
  isDeletingEntry.value = false

  if (!deleted) {
    return
  }

  isDeleteDialogOpen.value = false
  pendingDeleteEntryId.value = null
}

const submitEntry = async () => {
  const created = await createEntry()

  if (created) {
    closeEntryModal()
  }
}

onMounted(() => {
  void initializeSession()
})
</script>
