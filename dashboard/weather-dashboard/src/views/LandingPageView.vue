<template>
  <div
    class="min-h-screen bg-[var(--color-background)] text-[var(--color-text-main)] font-sans antialiased selection:bg-[var(--color-primary)] selection:text-[var(--color-primary-text)] overflow-x-hidden flex flex-col transition-colors duration-300"
    @mousemove="handleGlobalMouseMove"
  >
    <div
      class="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500"
      :style="{
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, var(--color-primary-dim), transparent 40%)`,
        opacity: 0.15,
      }"
    ></div>

    <div
      class="fixed inset-0 opacity-[0.035] pointer-events-none z-0 mix-blend-multiply"
      style="background-image: url('https://grainy-gradients.vercel.app/noise.svg')"
    ></div>

    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        class="parallax-blob absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--color-primary)]/10 rounded-full blur-[100px]"
        data-speed="0.05"
      ></div>
      <div
        class="parallax-blob absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"
        data-speed="-0.05"
      ></div>
    </div>

    <nav
      class="fixed top-0 inset-x-0 z-50 px-4 py-3 sm:py-6 flex justify-center transition-all duration-500 ease-in-out nav-container"
      :class="{ 'py-2 sm:py-3': isScrolled }"
    >
      <div
        class="w-full max-w-6xl flex items-center justify-between rounded-full px-4 sm:px-5 py-2.5 sm:py-3 transition-all duration-500 backdrop-blur-md"
        :class="[
          isScrolled
            ? 'bg-[var(--color-surface)]/80 shadow-md border border-[var(--color-border)]/50'
            : 'bg-transparent border border-transparent shadow-none',
        ]"
      >
        <div class="flex items-center space-x-2 group cursor-pointer" @click="$router.push('/')">
          <Icon
            icon="ph:cloud-sun-bold"
            class="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-text-main)] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
          />
          <span class="text-sm sm:text-base font-bold text-[var(--color-text-main)] tracking-tight"
            >Climate Monitoring</span
          >
        </div>

        <div
          class="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-text-light)]"
        >
          <button
            @click="scrollToSection(featuresSection)"
            class="relative hover:text-[var(--color-text-main)] transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-[var(--color-primary)] after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform"
          >
            Architecture
          </button>
          <button
            @click="scrollToSection(hardwareSection)"
            class="relative hover:text-[var(--color-text-main)] transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-[var(--color-primary)] after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform"
          >
            Specs
          </button>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <button
            @click="$router.push({ name: 'login' })"
            class="hidden sm:block text-xs font-semibold text-[var(--color-text-light)] hover:text-[var(--color-text-main)] transition-colors px-3"
          >
            Sign In
          </button>
          <button
            @click="$router.push({ name: 'signup' })"
            class="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] text-[11px] sm:text-xs font-semibold transition-all duration-300 shadow-lg hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--color-primary)]/20 active:scale-95"
          >
            Get Started
          </button>

          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 -mr-2 text-[var(--color-text-light)] active:scale-95 transition-transform"
          >
            <Icon :icon="mobileMenuOpen ? 'ph:x' : 'ph:list'" class="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>

    <transition
      enter-active-class="transition duration-300 ease-spring"
      enter-from-class="opacity-0 -translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-4 scale-95"
    >
      <div
        v-if="mobileMenuOpen"
        class="fixed top-16 left-4 right-4 z-40 bg-[var(--color-surface)]/95 backdrop-blur-xl shadow-2xl rounded-3xl p-2 border border-[var(--color-border)] md:hidden flex flex-col gap-1 ring-1 ring-black/5 origin-top"
      >
        <button
          @click="scrollToSection(featuresSection)"
          class="w-full text-left p-3 rounded-2xl hover:bg-[var(--color-hover)] text-[var(--color-text-main)] text-sm font-medium transition-colors"
        >
          System Architecture
        </button>
        <button
          @click="scrollToSection(hardwareSection)"
          class="w-full text-left p-3 rounded-2xl hover:bg-[var(--color-hover)] text-[var(--color-text-main)] text-sm font-medium transition-colors"
        >
          Hardware Specs
        </button>
      </div>
    </transition>

    <main class="flex-grow">
      <header class="relative pt-32 pb-12 sm:pt-48 sm:pb-32 px-4 sm:px-6 overflow-hidden">
        <div class="max-w-5xl mx-auto text-center relative z-10">
          <div
            class="hero-el inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-md mb-6 sm:mb-8 opacity-0"
          >
            <div class="flex items-center gap-2">
              <Icon
                icon="ph:map-pin-fill"
                class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--color-text-light)] animate-bounce-slow"
              />
              <span
                class="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[var(--color-text-light)] truncate max-w-[200px] sm:max-w-none"
              >
                Brgy. Angayen, Balo-I, LDN
              </span>
            </div>
          </div>

          <h1
            class="hero-el text-3xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[var(--color-text-main)] mb-4 sm:mb-6 opacity-0 leading-[1.1] min-h-[1.1em]"
            ref="scrambleTitleRef"
          >
            IOT-BASED CLIMATE MONITORING
          </h1>

          <p
            class="hero-el text-sm sm:text-xl text-[var(--color-text-light)] leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 font-light opacity-0 px-2"
          >
            Deploying autonomous sensor nodes to monitor rice paddy micro-climates. Real-time
            detection of temperature, humidity, and rainfall onset.
          </p>

          <div
            class="hero-el flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 opacity-0 px-2 sm:px-4"
          >
            <button
              @click="$router.push({ name: 'dashboard' })"
              class="w-full sm:w-auto min-w-[180px] px-8 py-3.5 sm:py-4 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-full text-sm font-medium hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-[var(--color-primary)]/30 hover:-translate-y-1 active:scale-95"
            >
              Open Dashboard
            </button>
            <button
              @click="scrollToSection(featuresSection)"
              class="w-full sm:w-auto min-w-[180px] px-8 py-3.5 sm:py-4 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-full text-sm font-medium hover:bg-[var(--color-hover)] transition-all duration-300 hover:-translate-y-1 active:scale-95"
            >
              View Architecture
            </button>
          </div>
        </div>
      </header>

      <section
        class="stats-section border-y border-[var(--color-border)]/50 bg-[var(--color-surface)]/40 backdrop-blur-md relative z-20"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-y-4 md:gap-y-0">
            <div
              v-for="(stat, i) in stats"
              :key="i"
              class="stat-item relative py-8 sm:py-12 flex flex-col items-center justify-center group cursor-default opacity-0"
            >
              <div
                class="absolute inset-x-4 inset-y-2 bg-[var(--color-text-main)]/5 rounded-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-out -z-10"
              ></div>

              <div
                class="text-4xl sm:text-5xl font-extralight tracking-tight text-[var(--color-text-main)] mb-2"
              >
                <span v-if="stat.isNumber" class="gsap-counter" :data-target="stat.value">0</span>
                <span v-else>{{ stat.value }}</span>
              </div>

              <div
                class="flex items-center gap-1.5 text-[var(--color-text-light)] group-hover:text-[var(--color-primary)] transition-colors duration-300"
              >
                <Icon :icon="stat.icon" class="w-3.5 h-3.5 opacity-70" />
                <span class="text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                  {{ stat.label }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref="featuresSection"
        class="py-16 sm:py-24 px-4 sm:px-6 relative z-10 overflow-hidden"
      >
        <div class="max-w-6xl mx-auto">
          <div
            class="step-header mb-10 sm:mb-16 text-center md:text-left border-b border-[var(--color-border)] pb-6 opacity-0"
          >
            <h2
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-main)] mb-2"
            >
              System Workflow
            </h2>

            <p class="text-sm sm:text-base text-[var(--color-text-light)] font-light">
              Data Pipeline: Sensor Node → Gateway → Firebase → AI.
            </p>
          </div>

          <div class="mb-16 relative">
            <div
              class="step-line hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-[var(--color-border)] -translate-y-1/2 -z-10 origin-left scale-x-0 overflow-hidden"
            >
              <div
                class="data-packet absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-0"
              ></div>
            </div>

            <div class="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
              <div
                class="step-card w-full md:w-1/3 bg-[var(--color-surface)] p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col items-center text-center relative z-10 group opacity-0 translate-y-10"
              >
                <div
                  class="w-12 h-12 rounded-full bg-[var(--color-green-50)] border border-[var(--color-green-100)] flex items-center justify-center mb-4 text-[var(--color-green-600)]"
                >
                  <Icon icon="ph:plant-bold" class="w-6 h-6" />
                </div>
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-light)] mb-1"
                  >Step 01</span
                >
                <h4 class="font-bold text-[var(--color-text-main)] text-lg">Sensors</h4>
                <p class="text-xs text-[var(--color-text-light)] mt-1">DHT22 & Rain Module</p>
              </div>

              <div
                class="step-arrow text-[var(--color-border)] flex-shrink-0 z-10 bg-[var(--color-background)] p-2 rounded-full opacity-0"
              >
                <Icon icon="ph:arrow-down-bold" class="w-6 h-6 md:hidden animate-bounce" />
                <Icon icon="ph:arrow-right-bold" class="hidden md:block w-6 h-6" />
              </div>

              <div
                class="step-card w-full md:w-1/3 bg-[var(--color-primary)] p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col items-center text-center relative z-10 group opacity-0 translate-y-10"
              >
                <div
                  class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-[var(--color-primary-text)]"
                >
                  <Icon icon="ph:cpu-bold" class="w-6 h-6" />
                </div>
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary-text)]/60 mb-1"
                  >Step 02</span
                >
                <h4 class="font-bold text-[var(--color-primary-text)] text-lg">ESP32 MCU</h4>
                <p class="text-xs text-[var(--color-primary-text)]/60 mt-1">JSON Serialization</p>
              </div>

              <div
                class="step-arrow text-[var(--color-border)] flex-shrink-0 z-10 bg-[var(--color-background)] p-2 rounded-full opacity-0"
              >
                <Icon icon="ph:arrow-down-bold" class="w-6 h-6 md:hidden animate-bounce" />
                <Icon icon="ph:arrow-right-bold" class="hidden md:block w-6 h-6" />
              </div>

              <div
                class="step-card w-full md:w-1/3 bg-[var(--color-surface)] p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col items-center text-center relative z-10 group opacity-0 translate-y-10"
              >
                <div
                  class="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mb-4 text-[var(--color-primary)]"
                >
                  <Icon icon="ph:cloud-bold" class="w-6 h-6" />
                </div>
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-light)] mb-1"
                  >Step 03</span
                >
                <h4 class="font-bold text-[var(--color-text-main)] text-lg">Firebase</h4>
                <p class="text-xs text-[var(--color-text-light)] mt-1">Realtime Database</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 perspective-container">
            <div
              class="bento-card tilt-card md:col-span-2 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-[var(--color-surface)] border border-[var(--color-border)] group opacity-0 translate-y-8"
            >
              <div class="flex items-start justify-between mb-6 sm:mb-8">
                <div
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-main)] group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-primary-text)] transition-colors duration-500 group-hover:rotate-12"
                >
                  <Icon icon="ph:wifi-high-bold" class="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span
                  class="px-3 py-1 rounded-full bg-[var(--color-background)] text-[9px] sm:text-[10px] font-bold text-[var(--color-text-light)] uppercase tracking-wide group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors"
                  >Telemetry</span
                >
              </div>
              <h3 class="text-lg sm:text-xl font-medium text-[var(--color-text-main)] mb-3">
                Field Data Collection
              </h3>
              <p class="text-[var(--color-text-light)] text-sm leading-relaxed max-w-md">
                The ESP32 microcontroller continuously polls the <strong>DHT22</strong> and
                <strong>Rainfall Sensor</strong>, creating a live stream of micro-climatic
                conditions.
              </p>
            </div>

            <div
              class="bento-card tilt-card md:row-span-2 flex flex-col bg-[var(--color-surface)]/80 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group opacity-0 translate-y-8"
            >
              <div
                class="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow"
              ></div>
              <div class="flex items-center justify-between mb-6 flex-shrink-0 z-10">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-2xl bg-[var(--color-purple-200)]/30 text-[var(--color-purple-900)] flex items-center justify-center"
                  >
                    <Icon icon="ph:sparkle-fill" class="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      class="text-base sm:text-lg font-bold text-[var(--color-text-main)] leading-none mb-1"
                    >
                      Gemini Analysis
                    </h3>
                    <p
                      class="text-[10px] font-semibold text-purple-500/80 uppercase tracking-widest"
                    >
                      Live Inference
                    </p>
                  </div>
                </div>
              </div>
              <div
                class="flex-grow overflow-y-auto space-y-6 relative z-10 custom-scrollbar pr-2 pl-1"
              >
                <div class="relative pl-6 border-l-2 border-[var(--color-border)] group/item">
                  <div
                    class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] group-hover/item:border-[var(--color-green-600)] transition-colors"
                  ></div>
                  <h4 class="text-xs font-bold text-[var(--color-text-main)] mb-1">Crop Health</h4>
                  <p class="text-xs text-[var(--color-text-light)]">
                    Conditions optimal. Maintain water levels.
                  </p>
                </div>
                <div class="relative pl-6 border-l-2 border-[var(--color-border)] group/item">
                  <div
                    class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] group-hover/item:border-orange-500 transition-colors"
                  ></div>
                  <h4 class="text-xs font-bold text-[var(--color-text-main)] mb-1">Pest Alert</h4>
                  <p class="text-xs text-[var(--color-text-light)]">
                    Humidity 76%. Watch for Rice Blast.
                  </p>
                </div>
              </div>
            </div>

            <div
              class="bento-card tilt-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-[var(--color-surface)] border border-[var(--color-border)] group opacity-0 translate-y-8"
            >
              <div
                class="mb-4 text-[var(--color-text-main)] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"
              >
                <Icon icon="ph:bell-ringing-bold" class="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 class="text-base sm:text-lg font-medium text-[var(--color-text-main)] mb-2">
                Smart Alerts
              </h3>
              <p class="text-[var(--color-text-light)] text-xs leading-relaxed">
                Immediate SMS notifications to farmers when thresholds are breached.
              </p>
            </div>

            <div
              class="bento-card tilt-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-[var(--color-surface)] border border-[var(--color-border)] group opacity-0 translate-y-8"
            >
              <div
                class="mb-4 text-[var(--color-text-main)] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"
              >
                <Icon icon="ph:database-bold" class="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 class="text-base sm:text-lg font-medium text-[var(--color-text-main)] mb-2">
                Realtime DB
              </h3>
              <p class="text-[var(--color-text-light)] text-xs leading-relaxed">
                Low latency data storage ensuring history is always available &lt;100ms.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        ref="hardwareSection"
        class="hardware-section py-16 sm:py-24 bg-[var(--color-surface)] px-4 sm:px-6 border-t border-[var(--color-border)] relative z-10"
      >
        <div class="max-w-5xl mx-auto">
          <div class="hardware-header text-center mb-10 sm:mb-16 opacity-0">
            <h2 class="text-2xl sm:text-3xl font-semibold text-[var(--color-text-main)] mb-3">
              Hardware Specs
            </h2>
            <div class="w-12 h-1 bg-[var(--color-primary)] mx-auto rounded-full"></div>
            <p class="text-sm text-[var(--color-text-light)] mt-4">
              Industrial-grade functionality, accessible components.
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 mt-8 sm:mt-12">
            <div
              v-for="(item, i) in hardwareComponents"
              :key="i"
              class="hardware-card p-4 sm:p-6 rounded-3xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col items-center text-center group transition-all duration-500 hover:shadow-xl hover:-translate-y-2 opacity-0 translate-y-8"
            >
              <div
                class="hardware-icon w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-primary-text)] transition-all duration-300"
              >
                <Icon
                  :icon="item.icon"
                  class="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-text-light)] group-hover:text-[var(--color-primary-text)] transition-colors"
                />
              </div>
              <h3 class="font-bold text-xs sm:text-sm text-[var(--color-text-main)] mb-1">
                {{ item.name }}
              </h3>
              <p
                class="text-[9px] sm:text-[10px] text-[var(--color-text-light)] uppercase tracking-wide"
              >
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        class="cta-section py-16 sm:py-32 px-4 sm:px-6 bg-[var(--color-surface)] border-t border-[var(--color-border)] relative overflow-hidden"
      >
        <div class="max-w-3xl mx-auto text-center relative z-10 opacity-0 scale-95 cta-container">
          <h2
            class="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 sm:mb-6 text-[var(--color-text-main)]"
          >
            Deploy today.
          </h2>
          <p class="text-[var(--color-text-light)] mb-8 sm:mb-10 text-base sm:text-lg font-light">
            Join the agricultural modernization initiative.
          </p>
          <div
            class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <button
              @click="$router.push({ name: 'signup' })"
              class="w-full sm:w-auto min-w-[160px] px-8 py-3.5 sm:py-4 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-full font-bold hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer
      class="bg-[var(--color-surface)] border-t border-[var(--color-border)] py-10 px-6 relative z-10"
    >
      <div class="max-w-6xl mx-auto text-center">
        <p class="text-[var(--color-text-light)] text-sm font-medium">
          &copy; {{ currentYear }} Climate Monitoring. All Rights Reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// --- STATE ---
const scrollY = ref(0)
const isScrolled = computed(() => scrollY.value > 20)
const featuresSection = ref(null)
const hardwareSection = ref(null)
const mobileMenuOpen = ref(false)
const currentYear = new Date().getFullYear()
const scrambleTitleRef = ref(null)
const mousePos = ref({ x: 0, y: 0 }) // For Spotlight

// --- DATA ---
const hardwareComponents = [
  { name: 'ESP32-WROOM', desc: 'Controller', icon: 'ph:cpu' },
  { name: 'DHT22', desc: 'Temp / Hum', icon: 'ph:thermometer-simple' },
  { name: 'Rain Module', desc: 'Precipitation', icon: 'ph:cloud-rain' },
  { name: 'Solar Module', desc: '12V 15W', icon: 'ph:sun-dim' },
]

const stats = [
  { value: '99%', label: 'Uptime', isNumber: false, icon: 'ph:lightning-fill' },
  { value: 15, label: 'Min Rate', isNumber: true, icon: 'ph:timer-fill' },
  { value: 24, label: 'Hr History', isNumber: true, icon: 'ph:clock-counter-clockwise-fill' },
  { value: 3, label: 'Active Nodes', isNumber: true, icon: 'ph:broadcast-fill' },
]

// --- METHODS ---
const handleScroll = () => {
  scrollY.value = window.scrollY
}

const handleGlobalMouseMove = (e) => {
  // Update spotlight position
  mousePos.value = { x: e.clientX, y: e.clientY }

  // 3D Tilt Logic
  // We use class-based selection inside the event for performance (delegation style)
  const cards = document.querySelectorAll('.tilt-card')

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect()
    // Check if mouse is near or inside the card to save calculation
    if (
      e.clientX >= rect.left - 50 &&
      e.clientX <= rect.right + 50 &&
      e.clientY >= rect.top - 50 &&
      e.clientY <= rect.bottom + 50
    ) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      // Calculate rotation (max 10 degrees)
      const rotateX = ((deltaY / rect.height) * -8).toFixed(2)
      const rotateY = ((deltaX / rect.width) * 8).toFixed(2)

      gsap.to(card, {
        transformPerspective: 1000,
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.1, // fast response
        overwrite: 'auto',
      })
    } else {
      // Reset if far away
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.75)',
        overwrite: 'auto',
      })
    }
  })
}

const scrollToSection = (elementRef) => {
  if (elementRef) {
    const yOffset = -100
    const y = elementRef.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
    mobileMenuOpen.value = false
  }
}

// Scramble Text Logic
const scrambleText = (element, finalString) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let iterations = 0
  const interval = setInterval(() => {
    element.innerText = finalString
      .split('')
      .map((letter, index) => {
        if (index < iterations) return finalString[index]
        return chars[Math.floor(Math.random() * chars.length)]
      })
      .join('')

    if (iterations >= finalString.length) clearInterval(interval)
    iterations += 1 / 2 // Speed of resolve
  }, 30)
}

// --- GSAP CONTEXT ---
let ctx

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })

  // Trigger Scramble Text on Load
  if (scrambleTitleRef.value) {
    const originalText = scrambleTitleRef.value.innerText
    scrambleText(scrambleTitleRef.value, originalText)
  }

  ctx = gsap.context(() => {
    // 1. HERO LOAD
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    heroTl
      .to('.hero-el', { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 })
      .from('.nav-container', { y: -20, opacity: 0, duration: 0.8 }, 0)

    // 2. PARALLAX BLOBS
    gsap.to('.parallax-blob', {
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
      },
      y: (i, target) => window.innerHeight * parseFloat(target.dataset.speed),
      ease: 'none',
    })

    // 3. STATS STRIP
    ScrollTrigger.batch('.stat-item', {
      start: 'top 85%',
      onEnter: (batch) => {
        gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power2.out' })
        // Counter animation
        batch.forEach((item) => {
          const counter = item.querySelector('.gsap-counter')
          if (counter) {
            const target = parseInt(counter.dataset.target)
            const obj = { val: 0 }
            gsap.to(obj, {
              val: target,
              duration: 2,
              ease: 'power1.out',
              onUpdate: () => {
                counter.innerText = Math.floor(obj.val)
              },
            })
          }
        })
      },
    })

    // 4. WORKFLOW STEPS + PACKET FLOW
    const flowTl = gsap.timeline({
      scrollTrigger: { trigger: '.step-header', start: 'top 75%' },
    })

    flowTl
      .to('.step-header', { opacity: 1, duration: 0.8 })
      .to('.step-line', { scaleX: 1, duration: 1, ease: 'power2.inOut' }, '-=0.4')
      .to(
        '.step-card, .step-arrow',
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'back.out(1.7)',
        },
        '-=0.8',
      )

    // Packet Animation (Infinite Loop)
    gsap.to('.data-packet', {
      left: '100%',
      opacity: [0, 1, 1, 0], // Fade in then out at ends
      duration: 2.5,
      repeat: -1,
      ease: 'power1.inOut',
    })

    // 5. BENTO GRID (ELASTIC)
    gsap.to('.bento-card', {
      scrollTrigger: { trigger: '.bento-card', start: 'top 80%' },
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'elastic.out(1, 0.75)',
    })

    // 6. HARDWARE FLOATING ICONS
    gsap.to('.hardware-header', {
      scrollTrigger: { trigger: '.hardware-section', start: 'top 75%' },
      opacity: 1,
      duration: 0.8,
    })

    const hwTl = gsap.timeline({
      scrollTrigger: { trigger: '.hardware-section', start: 'top 75%' },
    })
    hwTl.to('.hardware-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' })

    // Gentle Float for Icons
    gsap.to('.hardware-icon', {
      y: -5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.2,
    })

    // 7. CTA
    gsap.to('.cta-container', {
      scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power3.out',
    })
  }) // End Context
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  ctx.revert()
})
</script>

<style scoped>
:root {
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-primary: #1a73e8;
  --color-primary-dim: rgba(26, 115, 232, 0.5); /* For spotlight */
  --color-primary-text: #ffffff;
  --color-text-main: #202124;
  --color-text-light: #5f6368;
  --color-border: #e5e7eb;
  --color-hover: #e8eaed;

  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-600: #16a34a;

  --color-purple-200: #ddd6fe;
  --color-purple-900: #5b21b6;
}

/* Optional Dark Mode overrides if you want them */
html.dark {
  --color-background: #000000;
  --color-surface: #121212;
  --color-primary: #8ab4f8;
  --color-primary-dim: rgba(138, 180, 248, 0.5);
  --color-primary-text: #1a1a1a;
  --color-text-main: #e8eaed;
  --color-text-light: #9aa0a6;
  --color-border: #374151;
  --color-hover: #2a2a2a;

  --color-green-50: #0d1e13;
  --color-green-100: #1a2d20;
  --color-green-600: #7be0a3;

  --color-purple-200: #3a3255;
  --color-purple-900: #1e1b2e;
}

/* GSAP Init states */
.hero-el,
.stat-item,
.bento-card,
.step-card,
.hardware-card,
.step-arrow {
  transform: translateY(30px);
}

.perspective-container {
  perspective: 1000px;
}
.tilt-card {
  transform-style: preserve-3d;
  will-change: transform;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 20px;
}
</style>
