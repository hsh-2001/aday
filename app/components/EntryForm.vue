<template>
  <form class="grid gap-4 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm" @submit.prevent="$emit('submit')">
    <div>
      <p class="text-xs font-bold uppercase text-primary">New Entry</p>
      <h2 class="mt-1 text-xl font-black">Add spending</h2>
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Amount</legend>
      <input v-model.number="form.amount" class="input w-full" min="0.01" required step="0.01" type="number">
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Category</legend>
      <input v-model.trim="form.category" class="input w-full" list="categories" required>
      <datalist id="categories">
        <option value="Food" />
        <option value="Transport" />
        <option value="Coffee" />
        <option value="Shopping" />
        <option value="Bills" />
      </datalist>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Time</legend>
      <input v-model="form.spentAt" class="input w-full" type="datetime-local">
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Note</legend>
      <textarea v-model.trim="form.note" class="textarea min-h-24 w-full resize-y" rows="3" />
    </fieldset>

    <div v-if="error" class="alert alert-error py-3 text-sm">
      <span>{{ error }}</span>
    </div>

    <button type="submit" class="btn btn-primary" :disabled="loading">
      <span v-if="loading" class="loading loading-spinner loading-sm" />
      {{ loading ? 'Saving...' : 'Save entry' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { EntryForm } from '../types/api'

defineProps<{
  error: string
  loading: boolean
}>()

defineEmits<{
  submit: []
}>()

const form = defineModel<EntryForm>('form', { required: true })
</script>
