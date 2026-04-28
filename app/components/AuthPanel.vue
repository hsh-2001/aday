<template>
  <section class="mt-4 grid gap-6 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm lg:grid-cols-[minmax(220px,0.7fr)_minmax(260px,1fr)] lg:p-6">
    <div class="self-start">
      <p class="text-xs font-bold uppercase text-primary">Account</p>
      <h2 class="mt-1 text-2xl font-black">{{ mode === 'login' ? 'Log in' : 'Create account' }}</h2>
      <p class="mt-3 max-w-sm text-sm leading-6 text-base-content/70">
        Keep your daily expenses tied to one account so totals and entries stay private.
      </p>
    </div>

    <form class="grid gap-4" @submit.prevent="$emit('submit')">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Username</legend>
        <input v-model.trim="form.username" autocomplete="username" class="input w-full" required>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Password</legend>
        <input
          v-model="form.password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          class="input w-full"
          minlength="6"
          required
          type="password"
        >
      </fieldset>

      <div v-if="error" class="alert alert-error py-3 text-sm">
        <span>{{ error }}</span>
      </div>

      <div class="flex flex-wrap gap-3">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm" />
          {{ loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register' }}
        </button>
        <button type="button" class="btn btn-ghost" @click="$emit('toggleMode')">
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
