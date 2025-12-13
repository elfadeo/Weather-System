<template>
  <div class="min-h-screen bg-background text-text-main transition-colors duration-500">
    <!-- Hero Section -->
    <header class="relative overflow-hidden">
      <!-- Animated background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl transition-all duration-500"
          :style="{ transform: `translateY(${scrollY * 0.5}px)` }"
        />
        <div
          class="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl transition-all duration-500"
          :style="{ transform: `translateY(${scrollY * -0.3}px)` }"
        />
      </div>

      <!-- Navigation -->
      <nav
        class="relative z-10 flex items-center justify-between px-4 sm:px-6 py-6 max-w-7xl mx-auto"
      >
        <div class="flex items-center space-x-2">
          <Icon
            icon="ph:cloud-sun-bold"
            class="w-7 h-7 sm:w-8 sm:h-8 text-primary transition-colors duration-500"
          />
          <span class="text-xl sm:text-2xl font-bold text-text-main transition-colors duration-500"
            >Climate Monitor</span
          >
        </div>
        <div class="flex items-center gap-3 sm:gap-6">
          <button
            @click="$router.push({ name: 'login' })"
            class="text-text-light hover:text-text-main text-sm font-medium transition-colors duration-200"
          >
            Sign In
          </button>
          <button
            @click="$router.push({ name: 'signup' })"
            class="px-4 sm:px-5 py-2 text-sm font-medium text-text-main border border-border rounded-lg hover:bg-hover transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </nav>

      <!-- Hero Content -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-32">
        <div class="text-center space-y-6 animate-fade-in">
          <div
            class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface/80 backdrop-blur-sm rounded-full border border-border/50 text-xs sm:text-sm text-text-light mb-4"
          >
            <Icon icon="ph:map-pin-bold" class="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span class="truncate max-w-[250px] sm:max-w-none"
              >Brgy. Angayen, Baloi, Lanao del Norte</span
            >
          </div>
          <h1
            class="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-text-main transition-colors duration-500 px-2"
          >
            IoT-Based Climate Monitoring
            <span
              class="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/70 mt-1 sm:mt-2"
            >
              for Rice Cultivation
            </span>
          </h1>
          <p
            class="text-base sm:text-lg md:text-xl lg:text-2xl text-text-light max-w-3xl mx-auto transition-colors duration-500 px-2"
          >
            Real-time field monitoring with ESP32 sensors. Track temperature, humidity, and rainfall
            to protect your crops and optimize irrigation.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              @click="$router.push({ name: 'dashboard' })"
              class="px-8 py-3 text-sm font-medium text-primary-text bg-primary rounded-lg hover:opacity-90 transition-all duration-200"
            >
              View Dashboard
            </button>
            <button
              @click="scrollToFeatures"
              class="px-8 py-3 text-sm font-medium text-text-main border border-border rounded-lg hover:bg-hover transition-all duration-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- How It Works Section -->
    <section
      ref="featuresSection"
      class="py-16 sm:py-20 px-4 sm:px-6 bg-surface/30 backdrop-blur-sm transition-colors duration-500"
    >
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 transition-colors duration-500"
          >
            How the System Works
          </h2>
          <p class="text-lg sm:text-xl text-text-light transition-colors duration-500">
            From field sensors to AI-powered insights
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div
            v-for="(step, i) in systemSteps"
            :key="i"
            class="p-4 sm:p-6 lg:p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300"
          >
            <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div
                class="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm sm:text-base"
              >
                {{ i + 1 }}
              </div>
              <div
                class="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-primary/80 to-primary rounded-2xl flex items-center justify-center transition-colors duration-500"
              >
                <Icon
                  :icon="step.icon"
                  class="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary-text"
                />
              </div>
            </div>
            <h3
              class="text-base sm:text-lg lg:text-xl font-bold text-text-main mb-2 sm:mb-3 transition-colors duration-500"
            >
              {{ step.title }}
            </h3>
            <p
              class="text-sm sm:text-base text-text-light leading-relaxed mb-3 sm:mb-4 transition-colors duration-500"
            >
              {{ step.description }}
            </p>
            <div class="space-y-1.5 sm:space-y-2">
              <div
                v-for="(detail, j) in step.details"
                :key="j"
                class="flex items-start gap-2 text-xs sm:text-sm text-text-light"
              >
                <Icon
                  icon="ph:check-circle-bold"
                  class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0"
                />
                <span>{{ detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Features Section -->
    <section class="py-16 sm:py-20 px-4 sm:px-6 transition-colors duration-500">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 transition-colors duration-500"
          >
            Powerful Features for Farmers
          </h2>
          <p class="text-lg sm:text-xl text-text-light transition-colors duration-500">
            Everything you need to protect and optimize your rice cultivation
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div
            v-for="(feature, i) in farmerFeatures"
            :key="i"
            class="p-4 sm:p-6 lg:p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 hover:bg-surface hover:border-border transition-all duration-300"
          >
            <div class="flex items-start gap-3 sm:gap-4">
              <div
                class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/80 to-primary rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-500"
              >
                <Icon :icon="feature.icon" class="w-5 h-5 sm:w-6 sm:h-6 text-primary-text" />
              </div>
              <div>
                <h3
                  class="text-base sm:text-lg lg:text-xl font-bold text-text-main mb-1 sm:mb-2 transition-colors duration-500"
                >
                  {{ feature.title }}
                </h3>
                <p
                  class="text-sm sm:text-base text-text-light leading-relaxed transition-colors duration-500"
                >
                  {{ feature.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Hardware Components -->
    <section
      class="py-16 sm:py-20 px-4 sm:px-6 bg-surface/30 backdrop-blur-sm transition-colors duration-500"
    >
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 transition-colors duration-500"
          >
            Field Device Components
          </h2>
          <p class="text-lg sm:text-xl text-text-light transition-colors duration-500">
            Professional-grade sensors powered by solar energy
          </p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div
            v-for="(component, i) in hardwareComponents"
            :key="i"
            class="p-4 sm:p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 text-center hover:border-border transition-all duration-300"
          >
            <div
              class="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary/80 to-primary rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors duration-500"
            >
              <Icon
                :icon="component.icon"
                class="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-text"
              />
            </div>
            <h3
              class="text-sm sm:text-base lg:text-lg font-bold text-text-main mb-1 sm:mb-2 transition-colors duration-500"
            >
              {{ component.name }}
            </h3>
            <p class="text-xs sm:text-sm text-text-light transition-colors duration-500">
              {{ component.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-16 sm:py-20 px-4 sm:px-6 transition-colors duration-500">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 sm:mb-16">
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 transition-colors duration-500"
          >
            Benefits for Rice Farmers
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div
            v-for="(benefit, i) in benefits"
            :key="i"
            class="p-4 sm:p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 hover:bg-surface hover:border-border transition-all duration-300"
          >
            <Icon
              :icon="benefit.icon"
              class="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-primary mb-3 sm:mb-4 transition-colors duration-500"
            />
            <h3
              class="text-base sm:text-lg font-bold text-text-main mb-1 sm:mb-2 transition-colors duration-500"
            >
              {{ benefit.title }}
            </h3>
            <p class="text-xs sm:text-sm text-text-light transition-colors duration-500">
              {{ benefit.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section
      class="py-16 sm:py-20 px-4 sm:px-6 bg-surface/30 backdrop-blur-sm transition-colors duration-500"
    >
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
          <div
            v-for="(stat, i) in stats"
            :key="i"
            class="text-center p-4 sm:p-5 lg:p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:bg-surface"
          >
            <div
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2 transition-colors duration-500"
            >
              {{ stat.value }}
            </div>
            <div
              class="text-xs sm:text-sm lg:text-base text-text-light transition-colors duration-500"
            >
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 sm:py-20 px-4 sm:px-6 transition-colors duration-500">
      <div class="max-w-4xl mx-auto text-center">
        <div
          class="bg-gradient-to-br from-primary/90 to-primary rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 lg:p-16 shadow-lg transition-all duration-500"
        >
          <h2
            class="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-primary-text mb-3 sm:mb-4 lg:mb-6 px-2"
          >
            Start Monitoring Your Rice Field Today
          </h2>
          <p
            class="text-sm sm:text-base md:text-lg lg:text-xl text-primary-text/90 mb-4 sm:mb-6 lg:mb-8 max-w-2xl mx-auto px-2"
          >
            Join farmers in Brgy. Angayen using data-driven agriculture to protect crops and
            increase yields
          </p>
          <button
            @click="$router.push({ name: 'dashboard' })"
            class="px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 text-sm font-medium bg-surface text-text-main rounded-lg hover:bg-background transition-all duration-200 shadow-md"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer
      class="py-6 sm:py-8 lg:py-10 px-4 sm:px-6 border-t border-border bg-surface/30 backdrop-blur-sm transition-colors duration-500"
    >
      <div class="max-w-7xl mx-auto">
        <div
          class="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          <div class="flex items-center space-x-2">
            <Icon
              icon="ph:cloud-sun-bold"
              class="w-5 h-5 sm:w-6 sm:h-6 text-primary transition-colors duration-500"
            />
            <span
              class="text-base sm:text-lg font-bold text-text-main transition-colors duration-500"
              >Climate Monitor</span
            >
          </div>
          <div
            class="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-light text-center"
          >
            <Icon icon="ph:map-pin-bold" class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span class="truncate max-w-[250px] sm:max-w-none"
              >Brgy. Angayen, Baloi, Lanao del Norte</span
            >
          </div>
        </div>
        <div class="text-center text-text-light text-xs sm:text-sm transition-colors duration-500">
          <p class="px-2">
            © 2024 IoT-Based Climate Monitoring System. Supporting rice farmers with real-time
            data.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

const scrollY = ref(0)
const featuresSection = ref(null)

const systemSteps = [
  {
    icon: 'ph:cpu-bold',
    title: 'Data Collection',
    description:
      'ESP32 field device with DHT22 and rainfall sensors continuously monitors your rice field.',
    details: [
      'Real-time temperature & humidity',
      'Rainfall rate & accumulation',
      'Solar-powered operation',
      'Auto-reconnect Wi-Fi',
    ],
  },
  {
    icon: 'ph:cloud-arrow-up-bold',
    title: 'Cloud Processing',
    description: 'Data is instantly uploaded to Firebase and processed with automated scripts.',
    details: [
      'Live dashboard updates',
      'Alert checking every 15 min',
      'Daily summary generation',
      'Historical data storage',
    ],
  },
  {
    icon: 'ph:robot-bold',
    title: 'AI Analysis',
    description: 'Gemini AI analyzes climate patterns and generates farming recommendations.',
    details: [
      'Irrigation timing advice',
      'Disease risk warnings',
      'Fertilizer scheduling',
      'Crop stress detection',
    ],
  },
  {
    icon: 'ph:bell-bold',
    title: 'Smart Alerts',
    description: 'Receive instant notifications when dangerous conditions are detected.',
    details: [
      'Extreme heat warnings',
      'Flood risk alerts',
      'Disease-favorable conditions',
      'Email & SMS delivery',
    ],
  },
  {
    icon: 'ph:chart-line-bold',
    title: 'Dashboard Access',
    description: 'Monitor everything from your web dashboard with visual charts and insights.',
    details: ['Live weather display', 'Historical trends', 'Interactive maps', 'Alert history'],
  },
  {
    icon: 'ph:file-text-bold',
    title: 'Data Reports',
    description: 'Export complete weather data as CSV or PDF for documentation and analysis.',
    details: [
      'Custom date ranges',
      'Hourly/daily grouping',
      'Insurance documentation',
      'Farm record keeping',
    ],
  },
]

const farmerFeatures = [
  {
    icon: 'ph:eye-bold',
    title: 'Real-Time Monitoring',
    description:
      'Check live temperature, humidity, and rainfall to make immediate irrigation and field activity decisions.',
  },
  {
    icon: 'ph:chart-bar-bold',
    title: 'Historical Charts',
    description:
      'Visualize temperature trends, humidity patterns, and rainfall accumulation to understand your microclimate.',
  },
  {
    icon: 'ph:calendar-bold',
    title: '24-Hour Summaries',
    description:
      'Daily breakdown of average/min/max values, total rainfall, and weather pattern classification.',
  },
  {
    icon: 'ph:lightbulb-bold',
    title: 'AI Recommendations',
    description:
      'Get intelligent insights on pest risk, irrigation timing, and weather-based farm activity guidance.',
  },
  {
    icon: 'ph:bell-ringing-bold',
    title: 'Instant Alerts',
    description:
      'Receive email, SMS, and push notifications before crops are damaged by extreme conditions.',
  },
  {
    icon: 'ph:download-bold',
    title: 'Complete Reports',
    description:
      'Export CSV and PDF reports for any time range. Perfect for documentation, insurance claims, and analysis.',
  },
]

const hardwareComponents = [
  {
    icon: 'ph:cpu-bold',
    name: 'ESP32-WROOM',
    description: 'Main microcontroller with built-in Wi-Fi',
  },
  {
    icon: 'ph:thermometer-bold',
    name: 'DHT22 Sensor',
    description: 'Temperature & humidity measurement',
  },
  {
    icon: 'ph:cloud-rain-bold',
    name: 'Rain Sensor',
    description: 'Rainfall rate & accumulation tracking',
  },
  {
    icon: 'ph:battery-charging-bold',
    name: 'Solar Power',
    description: 'Renewable energy with battery backup',
  },
]

const benefits = [
  {
    icon: 'ph:shield-check-bold',
    title: 'Prevent Crop Damage',
    description: 'Early warnings before heat stress, flooding, or disease conditions occur',
  },
  {
    icon: 'ph:drop-bold',
    title: 'Save Water',
    description: 'Actual rainfall data prevents over-irrigation and optimizes water usage',
  },
  {
    icon: 'ph:calendar-check-bold',
    title: 'Better Planning',
    description: 'Historical patterns guide planting schedules and fertilizer timing',
  },
  {
    icon: 'ph:plant-bold',
    title: 'Data-Driven Farming',
    description: 'Make informed decisions based on real field data, not guesses',
  },
]

const stats = [
  { value: '24/7', label: 'Field Monitoring' },
  { value: '15min', label: 'Alert Checks' },
  { value: 'Real-Time', label: 'Data Updates' },
  { value: 'AI-Powered', label: 'Recommendations' },
]

let ticking = false

const handleScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      scrollY.value = window.scrollY
      ticking = false
    })
    ticking = true
  }
}

const scrollToFeatures = () => {
  if (featuresSection.value) {
    featuresSection.value.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}
</style>
