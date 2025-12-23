<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <!-- Minimal Header -->
      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-3xl font-bold text-text-main tracking-tight">Weather Alerts</h1>
          <p class="text-sm text-text-light mt-1">Scientifically validated monitoring</p>
        </div>

        <!-- Refresh Button -->
        <button
          @click="refreshHistory"
          :disabled="isLoadingHistory"
          class="group p-2.5 rounded-lg hover:bg-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :title="isLoadingHistory ? 'Refreshing...' : 'Refresh history'"
        >
          <Icon
            icon="ph:arrow-clockwise-bold"
            class="h-5 w-5 text-text-light group-hover:text-text-main transition-colors"
            :class="{ 'animate-spin': isLoadingHistory }"
          />
        </button>
      </div>

      <!-- System Info Banner -->
      <SystemInfoBanner />

      <!-- Main Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <!-- Sidebar: Active Thresholds -->
        <aside class="lg:col-span-1">
          <ThresholdCard />
        </aside>

        <!-- Main Content: Alert History -->
        <main class="lg:col-span-2 space-y-6">
          <!-- Alert History Card -->
          <section
            class="bg-surface/40 backdrop-blur-sm rounded-xl border border-border/50"
            aria-labelledby="history-heading"
          >
            <!-- Header -->
            <div class="px-6 py-5 border-b border-border/50">
              <h2 id="history-heading" class="text-lg font-semibold text-text-main">
                Alert History
              </h2>
              <p class="text-xs text-text-light mt-1">
                Recent threshold violations and notifications
              </p>
            </div>

            <!-- Loading State -->
            <div
              v-if="isLoadingHistory"
              class="p-12 flex flex-col items-center justify-center"
              role="status"
              aria-label="Loading alerts"
            >
              <Icon
                icon="ph:circle-notch-bold"
                class="h-10 w-10 animate-spin text-primary mb-3"
                aria-hidden="true"
              />
              <p class="text-sm text-text-light">Loading alerts...</p>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="!alertHistory.length"
              class="p-12 flex flex-col items-center justify-center text-center"
              role="status"
              aria-label="No alerts"
            >
              <div
                class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
              >
                <Icon
                  icon="ph:shield-check-bold"
                  class="h-8 w-8 text-green-500"
                  aria-hidden="true"
                />
              </div>
              <h3 class="text-base font-semibold text-text-main mb-1">All Clear!</h3>
              <p class="text-sm text-text-light max-w-xs">
                No alerts triggered recently. Monitoring continues every 15 minutes.
              </p>
            </div>

            <!-- Alert List -->
            <ul v-else class="divide-y divide-border/50" role="list" aria-label="Alert history">
              <AlertItem v-for="alert in alertHistory" :key="alert.id" :alert="alert" />
            </ul>

            <!-- Load More -->
            <div v-if="alertHistory.length >= 50" class="px-6 py-4 border-t border-border/50">
              <button
                @click="loadMoreAlerts"
                class="w-full py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Load More Alerts
              </button>
            </div>
          </section>

          <!-- Scientific References -->
          <ScientificReference />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useAlerts } from '@/composables/useAlerts'
import SystemInfoBanner from '@/components/Alerts/SystemInfoBanner.vue'
import ThresholdCard from '@/components/Alerts/ThresholdCard.vue'
import AlertItem from '@/components/Alerts/AlertItem.vue'
import ScientificReference from '@/components/Alerts/ScientificReference.vue'

const { alertHistory, isLoadingHistory, refreshHistory, loadMoreAlerts } = useAlerts()
</script>
