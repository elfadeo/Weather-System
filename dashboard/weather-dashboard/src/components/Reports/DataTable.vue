<template>
  <div
    class="bg-surface rounded-2xl shadow-md overflow-hidden ring-1 ring-border relative min-h-[500px]"
  >
    <LoadingOverlay v-if="isLoading" />

    <EmptyState v-if="!aggregatedData.length && !isLoading" />

    <div v-if="aggregatedData.length" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-border">
        <TableHeader />
        <tbody class="bg-surface divide-y divide-border">
          <TableRow v-for="record in aggregatedData" :key="record.sortKey" :record="record" />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import LoadingOverlay from './LoadingOverlay.vue'
import EmptyState from './EmptyState.vue'
import TableHeader from './TableHeader.vue'
import TableRow from './TableRow.vue'

defineProps({
  aggregatedData: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})
</script>
