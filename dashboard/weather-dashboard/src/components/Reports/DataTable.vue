<template>
  <div
    class="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden relative min-h-[400px] flex flex-col"
  >
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-[2px] flex items-center justify-center z-20"
      >
        <div class="text-center max-w-sm px-4">
          <Icon
            icon="ph:circle-notch-bold"
            class="h-8 w-8 text-[var(--color-primary)] mx-auto mb-3 animate-spin"
          />
          <p
            class="text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wide mb-2"
          >
            {{ loadingMessage || 'Loading report...' }}
          </p>

          <!-- Progress bar -->
          <div
            v-if="loadingProgress > 0"
            class="w-full bg-[var(--color-background)] rounded-full h-2 overflow-hidden"
          >
            <div
              class="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
              :style="{ width: `${loadingProgress}%` }"
            ></div>
          </div>
          <p v-if="loadingProgress > 0" class="text-xs text-[var(--color-text-light)] mt-1">
            {{ loadingProgress }}%
          </p>
        </div>
      </div>
    </Transition>

    <div
      v-if="!isLoading && !aggregatedData.length"
      class="absolute inset-0 flex flex-col items-center justify-center z-10"
    >
      <div
        class="w-16 h-16 rounded-full bg-[var(--color-background)] flex items-center justify-center mb-4"
      >
        <Icon
          icon="ph:database-duotone"
          class="h-8 w-8 text-[var(--color-text-light)] opacity-50"
        />
      </div>
      <h3 class="text-sm font-semibold text-[var(--color-text-main)] mb-1">No Data Found</h3>
      <p class="text-xs text-[var(--color-text-light)] max-w-[200px] text-center">
        Try adjusting your time range or filters to see results.
      </p>
    </div>

    <div class="overflow-x-auto flex-grow">
      <table class="w-full text-left border-collapse tabular-nums">
        <thead
          class="bg-[var(--color-background)] border-b border-[var(--color-border)] sticky top-0 z-10"
        >
          <tr>
            <th
              scope="col"
              class="py-3 px-6 text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider whitespace-nowrap"
            >
              Period
            </th>
            <th
              scope="col"
              class="py-3 px-6 text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider whitespace-nowrap text-right"
            >
              Temp (°C)
            </th>
            <th
              scope="col"
              class="py-3 px-6 text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider whitespace-nowrap text-right"
            >
              Humidity (%)
            </th>
            <th
              scope="col"
              class="py-3 px-6 text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider whitespace-nowrap text-right"
            >
              Rain Rate <span class="normal-case opacity-70">(mm/hr)</span>
            </th>
            <th
              scope="col"
              class="py-3 px-6 text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider whitespace-nowrap text-right"
            >
              Total Rain <span class="normal-case opacity-70">(mm)</span>
            </th>
            <th
              scope="col"
              class="py-3 px-6 text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider whitespace-nowrap text-right"
            >
              Readings
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
          <TableRow
            v-for="record in aggregatedData"
            :key="record.sortKey"
            :record="record"
            class="transition-colors hover:bg-[var(--color-background)]/50"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
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
  loadingProgress: {
    type: Number,
    default: 0,
  },
  loadingMessage: {
    type: String,
    default: '',
  },
})
</script>
