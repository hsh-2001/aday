<template>
  <form class="space-y-4 p-6" @submit.prevent="$emit('submit')">
    <div>
      <label class="mb-1 block text-xs font-bold uppercase text-slate-500">Title</label>
      <input
        v-model.trim="form.note"
        class="w-full rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Rent, coffee, groceries"
        type="text"
      >
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="mb-1 block text-xs font-bold uppercase text-slate-500">Amount</label>
        <input
          v-model.number="form.amount"
          class="w-full rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          min="0.01"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        >
      </div>
      <div>
        <label class="mb-1 block text-xs font-bold uppercase text-slate-500">Currency</label>
        <select
          v-model="form.currency"
          class="w-full appearance-none rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
            {{ currency.code }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="mb-1 block text-xs font-bold uppercase text-slate-500">Category</label>
        <input
          v-model.trim="form.category"
          class="w-full rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          list="categories"
          placeholder="General"
          required
        >
        <datalist id="categories">
          <option v-for="category in categories" :key="category" :value="category" />
        </datalist>
      </div>
      <div>
        <label class="mb-1 block text-xs font-bold uppercase text-slate-500">Time</label>
        <input
          v-model="form.spentAt"
          class="w-full rounded-xl border-none bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          type="datetime-local"
        >
      </div>
    </div>

    <div>
      <label class="mb-1 block text-xs font-bold uppercase text-slate-500">Add category</label>
      <div class="flex overflow-hidden rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500">
        <input
          v-model.trim="categoryName"
          class="min-w-0 flex-1 bg-transparent px-4 py-3 text-slate-900 outline-none"
          maxlength="48"
          placeholder="New category"
          type="text"
          @keydown.enter.prevent="$emit('addCategory')"
        >
        <button
          class="px-4 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:text-slate-300"
          :disabled="categoryLoading || !categoryName.trim()"
          type="button"
          @click="$emit('addCategory')"
        >
          {{ categoryLoading ? 'Adding...' : 'Add' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      {{ error }}
    </div>

    <button
      type="submit"
      class="mt-4 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="loading"
    >
      {{ loading ? 'Saving...' : 'Save Transaction' }}
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
