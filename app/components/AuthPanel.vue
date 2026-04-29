<template>
  <section class="mx-auto grid max-w-3xl gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:grid-cols-[minmax(220px,0.7fr)_minmax(260px,1fr)]">
    <div class="self-start">
      <p class="text-xs font-bold uppercase text-indigo-600">Account</p>
      <h2 class="mt-1 text-2xl font-black text-slate-900">{{ mode === 'login' ? 'Log in' : 'Create account' }}</h2>
      <p class="mt-3 max-w-sm text-sm leading-6 text-slate-500">
        Keep your daily expenses tied to one account so totals and entries stay private.
      </p>
    </div>

    <form class="grid gap-4" @submit.prevent="$emit('submit')">
      <label class="block">
        <span class="mb-1 block text-xs font-bold uppercase text-slate-500">Username</span>
        <input v-model.trim="form.username" autocomplete="username" class="w-full rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" required>
      </label>

      <label class="block">
        <span class="mb-1 block text-xs font-bold uppercase text-slate-500">Password</span>
        <input
          v-model="form.password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          class="w-full rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          minlength="6"
          required
          type="password"
        >
      </label>

      <div v-if="error" class="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
        {{ error }}
      </div>

      <div class="flex flex-wrap gap-3">
        <button type="submit" class="rounded-full bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-100 transition-colors hover:bg-indigo-700 disabled:opacity-60" :disabled="loading">
          {{ loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register' }}
        </button>
        <button type="button" class="rounded-full px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100" @click="$emit('toggleMode')">
          {{ mode === 'login' ? 'Need an account?' : 'Already registered?' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { AuthForm, AuthMode } from '../types/api'

defineProps<{
  error: string
  loading: boolean
  mode: AuthMode
}>()

defineEmits<{
  submit: []
  toggleMode: []
}>()

const form = defineModel<AuthForm>('form', { required: true })
</script>
