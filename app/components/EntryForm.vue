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
      <legend class="fieldset-legend">Currency</legend>
      <select v-model="form.currency" class="select w-full" required>
        <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
          {{ currency.label }}
        </option>
      </select>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Category</legend>
      <input v-model.trim="form.category" class="input w-full" list="categories" required>
      <datalist id="categories">
        <option v-for="category in categories" :key="category" :value="category" />
      </datalist>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Add category</legend>
      <div class="join w-full">
        <input
          v-model.trim="categoryName"
          class="input join-item min-w-0 flex-1"
          maxlength="48"
          placeholder="New category"
          type="text"
          @keydown.enter.prevent="$emit('addCategory')"
        >
        <button
          class="btn btn-outline join-item"
          :disabled="categoryLoading || !categoryName.trim()"
          type="button"
          @click="$emit('addCategory')"
        >
          <span v-if="categoryLoading" class="loading loading-spinner loading-xs" />
          Add
        </button>
      </div>
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
import type { CurrencyOption, EntryForm } from '../types/api'

defineProps<{
  categories: string[]
  categoryLoading: boolean
  currencies: CurrencyOption[]
  error: string
  loading: boolean
}>()

defineEmits<{
  addCategory: []
  submit: []
}>()

const categoryName = defineModel<string>('categoryName', { required: true })
const form = defineModel<EntryForm>('form', { required: true })
</script>
