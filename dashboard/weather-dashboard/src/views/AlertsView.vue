<template>
  <div class="p-4 sm:p-6 lg:p-8 min-h-screen font-sans">
    <div class="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            Weather Alerts
          </h1>
          <p class="text-sm text-text-light mt-1 flex items-center gap-2">
            <Icon icon="ph:shield-check-fill" class="text-green-600" />
            Scientifically validated monitoring
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span
            v-if="isLoadingHistory"
            class="text-xs font-medium text-primary animate-pulse hidden sm:block"
          >
            Syncing...
          </span>
          <button
            @click="refreshHistory"
            :disabled="isLoadingHistory"
            class="group p-2.5 rounded-lg border border-border bg-background hover:bg-hover hover:border-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
            :title="isLoadingHistory ? 'Refreshing...' : 'Refresh history'"
          >
            <Icon
              icon="ph:arrow-clockwise-bold"
              class="h-5 w-5 text-text-light group-hover:text-primary transition-colors"
              :class="{ 'animate-spin': isLoadingHistory }"
            />
          </button>
        </div>
      </div>

      <SystemInfoBanner />

      <div
        v-if="error"
        class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in shadow-sm"
      >
        <div class="p-2 bg-surface/50 rounded-full shrink-0">
          <Icon icon="ph:warning-octagon-fill" class="h-5 w-5 text-red-600" />
        </div>
        <div class="flex-1 pt-1">
          <h3 class="text-sm font-bold text-red-900">Connection Error</h3>
          <p class="text-xs text-red-800 mt-1 leading-relaxed">{{ error }}</p>
        </div>
        <button
          @click="refreshHistory"
          class="text-xs font-bold text-red-700 hover:text-red-900 underline px-3 py-1 mt-1"
        >
          Retry
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        <aside class="lg:col-span-1 space-y-6 lg:sticky lg:top-6 transition-all">
          <ThresholdCard />

          <div class="hidden lg:block opacity-90 hover:opacity-100 transition-opacity">
            <ScientificReference />
          </div>
        </aside>

        <main class="lg:col-span-2 space-y-6">
          <section
            class="bg-background rounded-xl border border-border shadow-sm overflow-hidden flex flex-col"
            style="min-height: 400px"
          >
            <div
              class="px-5 py-4 border-b border-border bg-hover/30 flex items-center justify-between"
            >
              <div>
                <h2 class="text-lg font-bold text-text-main flex items-center gap-2">
                  <Icon icon="ph:clock-counter-clockwise-bold" class="text-primary" />
                  Alert History
                </h2>
              </div>
              <span
                v-if="alertHistory.length > 0"
                class="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-bold text-text-light shadow-sm"
              >
                {{ alertHistory.length }} Events
              </span>
            </div>

            <div class="flex-1 flex flex-col">
              <div
                v-if="isLoadingHistory && !alertHistory.length"
                class="flex-1 flex flex-col items-center justify-center p-12 space-y-4"
              >
                <div class="relative">
                  <div
                    class="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
                  ></div>
                </div>
                <p class="text-sm font-medium text-text-light animate-pulse">
                  Retrieving sensor logs...
                </p>
              </div>

              <div
                v-else-if="!alertHistory.length && !error"
                class="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center"
              >
                <div
                  class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5 border border-green-200 shadow-inner"
                >
                  <Icon icon="ph:shield-check-fill" class="h-10 w-10 text-green-600" />
                </div>
                <h3 class="text-lg font-bold text-text-main mb-2">Optimal Conditions</h3>
                <p class="text-sm text-text-light max-w-sm leading-relaxed mx-auto">
                  No alerts have been triggered in the last 24 hours. Sensors are active and
                  monitoring every 15 minutes.
                </p>
                <div
                  class="mt-6 flex gap-2 text-xs text-text-light/70 bg-hover px-3 py-1.5 rounded-full"
                >
                  <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1"></span>
                  System Online
                </div>
              </div>

              <ul v-else class="divide-y divide-border">
                <AlertItem v-for="alert in alertHistory" :key="alert.id" :alert="alert" />
              </ul>
            </div>

            <div
              v-if="alertHistory.length > 0"
              class="px-5 py-4 border-t border-border bg-hover/10"
            >
              <button
                @click="loadMoreAlerts"
                :disabled="isLoadingMore"
                class="w-full group flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-text-light hover:text-primary hover:bg-surface hover:shadow-sm border border-transparent hover:border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!isLoadingMore">Load Older Alerts</span>
                <span v-else>Loading...</span>

                <Icon v-if="isLoadingMore" icon="ph:spinner-gap-bold" class="animate-spin" />
                <Icon
                  v-else
                  icon="ph:caret-down-bold"
                  class="group-hover:translate-y-0.5 transition-transform"
                />
              </button>
            </div>
          </section>

          <div class="lg:hidden">
            <ScientificReference />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useAlerts } from '@/composables/useAlerts'

// Components
import SystemInfoBanner from '@/components/Alerts/SystemInfoBanner.vue'
import ThresholdCard from '@/components/Alerts/ThresholdCard.vue'
import AlertItem from '@/components/Alerts/AlertItem.vue'
import ScientificReference from '@/components/Alerts/ScientificReference.vue'

// FIXED: Destructure 'isLoadingMore' here
const { alertHistory, isLoadingHistory, isLoadingMore, error, refreshHistory, loadMoreAlerts } =
  useAlerts()
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
