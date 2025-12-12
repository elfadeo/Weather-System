<template>
  <div class="p-3 sm:p-4 md:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4 sm:mb-6 md:mb-8">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-main tracking-tight">
          Alert System
        </h1>
        <p class="text-sm sm:text-base text-text-light mt-1 sm:mt-2">
          Real-time monitoring with scientifically validated thresholds
        </p>
      </div>

      <!-- System Info Banner -->
      <SystemInfoBanner />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <!-- Column 1: Active Thresholds -->
        <div class="lg:col-span-1">
          <ThresholdCard />
        </div>

        <!-- Column 2: Alert History -->
        <div class="lg:col-span-2">
          <div class="bg-surface rounded-xl sm:rounded-2xl shadow-sm border border-border">
            <!-- Header -->
            <div class="p-4 sm:p-5 md:p-6 border-b border-border">
              <div class="flex items-start sm:items-center justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h2 class="text-lg sm:text-xl font-bold text-text-main">Alert History</h2>
                  <p class="text-xs sm:text-sm text-text-light mt-1">
                    Recent threshold violations and email notifications
                  </p>
                </div>
                <button
                  @click="refreshHistory"
                  class="p-2 rounded-lg hover:bg-hover transition-colors flex-shrink-0"
                  title="Refresh history"
                >
                  <Icon
                    icon="ph:arrow-clockwise-bold"
                    class="h-5 w-5 text-text-light"
                    :class="{ 'animate-spin': isLoadingHistory }"
                  />
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoadingHistory" class="p-8 sm:p-12 text-center text-text-light">
              <Icon
                icon="ph:circle-notch-bold"
                class="h-8 sm:h-10 w-8 sm:w-10 animate-spin mx-auto mb-3 text-primary"
              />
              <p class="text-sm sm:text-base font-medium">Loading alert history...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!alertHistory.length" class="p-8 sm:p-12 text-center text-text-light">
              <Icon
                icon="ph:shield-check-bold"
                class="h-12 sm:h-16 w-12 sm:w-16 text-green-400 dark:text-green-500 mx-auto mb-4"
              />
              <p class="text-base sm:text-lg font-medium text-text-main">All Clear!</p>
              <p class="text-sm mt-2">No alerts have been triggered recently</p>
              <p class="text-xs mt-1 text-text-light">Monitoring continues every 15 minutes</p>
            </div>

            <!-- Alert List -->
            <ul v-else class="divide-y divide-border">
              <AlertItem v-for="alert in alertHistory" :key="alert.id" :alert="alert" />
            </ul>

            <!-- Load More Button -->
            <div v-if="alertHistory.length >= 50" class="p-3 sm:p-4 border-t border-border text-center">
              <button
                class="text-sm text-primary hover:underline font-medium"
                @click="loadMoreAlerts"
              >
                Load More Alerts
              </button>
            </div>
          </div>

          <!-- Scientific References -->
          <ScientificReference />
        </div>
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
