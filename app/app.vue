<template>
  <div class="min-h-screen bg-base-200 text-base-content">
    <NuxtRouteAnnouncer />

    <main class="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:py-8">
      <section class="navbar rounded-box border border-base-300 bg-base-100 px-4 shadow-sm sm:px-6">
        <div class="flex-1">
          <div>
            <p class="text-xs font-bold uppercase text-primary">A Day</p>
            <h1 class="text-2xl font-black tracking-tight sm:text-4xl">Daily Money Tracker</h1>
          </div>
        </div>

        <div v-if="user" class="flex flex-wrap items-center justify-end gap-3">
          <span class="badge badge-neutral badge-lg max-w-48 truncate">{{ user.username }}</span>
          <button type="button" class="btn btn-outline btn-sm" @click="logout">Log out</button>
        </div>
      </section>

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
          :total="dailyUsage?.total || 0"
          @refresh="loadDailyUsage"
        />

        <section class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
          <EntryForm
            v-model:form="entryForm"
            :error="errorMessage"
            :loading="isEntryLoading"
            @submit="createEntry"
          />

          <EntriesPanel
            :daily-usage="dailyUsage"
            :loading="isDailyLoading"
            :selected-date="selectedDate"
            @delete="deleteEntry"
            @refresh="loadDailyUsage"
          />
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
const {
  authForm,
  authMode,
  dailyUsage,
  entryForm,
  errorMessage,
  isAuthLoading,
  isDailyLoading,
  isEntryLoading,
  selectedDate,
  user,
  createEntry,
  deleteEntry,
  initializeSession,
  loadDailyUsage,
  logout,
  submitAuth,
  toggleAuthMode,
} = useMoneyTracker()

onMounted(() => {
  void initializeSession()
})
</script>
