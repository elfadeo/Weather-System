<template>
  <div
    class="min-h-screen bg-background text-text-main font-sans antialiased selection:bg-primary selection:text-primary-text overflow-x-hidden flex flex-col transition-colors duration-300"
  >
    <div
      class="fixed inset-0 opacity-[0.035] pointer-events-none z-0 mix-blend-multiply"
      style="background-image: url('https://grainy-gradients.vercel.app/noise.svg')"
    ></div>

    <nav
      class="fixed top-0 inset-x-0 z-50 px-4 py-3 sm:py-6 flex justify-center transition-all duration-500 ease-in-out"
      :class="{ 'py-2 sm:py-3': isScrolled }"
    >
      <div
        class="w-full max-w-6xl flex items-center justify-between rounded-full px-4 sm:px-5 py-2.5 sm:py-3 transition-all duration-500 backdrop-blur-md"
        :class="[
          isScrolled
            ? 'bg-surface/80 shadow-md border border-border/50'
            : 'bg-transparent border border-transparent shadow-none',
        ]"
      >
        <div class="flex items-center space-x-2 group cursor-pointer" @click="$router.push('/')">
          <Icon
            icon="ph:cloud-sun-bold"
            class="w-5 h-5 sm:w-6 sm:h-6 text-text-main transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
          />
          <span class="text-sm sm:text-base font-bold text-text-main tracking-tight"
            >Climate Monitoring</span
          >
        </div>

        <div class="hidden md:flex items-center gap-8 text-sm font-medium text-text-light">
          <button
            @click="scrollToSection(featuresSection)"
            class="relative hover:text-text-main transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-primary after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform"
          >
            Architecture
          </button>
          <button
            @click="scrollToSection(hardwareSection)"
            class="relative hover:text-text-main transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-primary after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform"
          >
            Specs
          </button>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <button
            @click="$router.push({ name: 'login' })"
            class="hidden sm:block text-xs font-semibold text-text-light hover:text-text-main transition-colors px-3"
          >
            Sign In
          </button>
          <button
            @click="$router.push({ name: 'signup' })"
            class="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-primary text-primary-text text-[11px] sm:text-xs font-semibold transition-all duration-300 shadow-lg hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 active:scale-95"
          >
            Get Started
          </button>

          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Toggle Menu"
            class="md:hidden p-2 -mr-2 text-text-light active:scale-95 transition-transform"
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
        class="fixed top-16 left-4 right-4 z-40 bg-surface/95 backdrop-blur-xl shadow-2xl rounded-3xl p-2 border border-border md:hidden flex flex-col gap-1 ring-1 ring-black/5 origin-top"
      >
        <button
          @click="scrollToSection(featuresSection)"
          class="w-full text-left p-3 rounded-2xl hover:bg-hover text-text-main text-sm font-medium transition-colors"
        >
          System Architecture
        </button>
        <button
          @click="scrollToSection(hardwareSection)"
          class="w-full text-left p-3 rounded-2xl hover:bg-hover text-text-main text-sm font-medium transition-colors"
        >
          Hardware Specs
        </button>
        <div class="h-px bg-border my-1 mx-2"></div>
        <button
          @click="$router.push({ name: 'login' })"
          class="w-full text-left p-3 rounded-2xl hover:bg-hover text-text-light text-sm font-medium transition-colors"
        >
          Log In
        </button>
      </div>
    </transition>

    <main class="flex-grow">
      <header class="relative pt-24 pb-12 sm:pt-48 sm:pb-32 px-4 sm:px-6 overflow-hidden">
        <div class="max-w-5xl mx-auto text-center relative z-10">
          <div
            class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border bg-surface/60 backdrop-blur-md mb-6 sm:mb-8 opacity-0 animate-fade-in-up shadow-sm hover:shadow-md transition-shadow cursor-default"
          >
            <div class="flex items-center gap-2">
              <Icon
                icon="ph:map-pin-fill"
                class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-light animate-bounce-slow"
              />
              <span
                class="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-text-light truncate max-w-[200px] sm:max-w-none"
              >
                Brgy. Angayen, Balo-I, LDN
              </span>
            </div>
          </div>

          <h1
            class="text-3xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-text-main mb-4 sm:mb-6 opacity-0 animate-fade-in-up leading-[1.1]"
            style="animation-delay: 150ms"
          >
            IOT-BASED CLIMATE MONITORING FOR RICE CULTIVATION<br />
          </h1>

          <p
            class="text-sm sm:text-xl text-text-light leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 font-light opacity-0 animate-fade-in-up px-2"
            style="animation-delay: 300ms"
          >
            Deploying autonomous sensor nodes to monitor rice paddy micro-climates. Real-time
            detection of temperature, humidity, and rainfall onset.
          </p>

          <div
            class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 opacity-0 animate-fade-in-up px-2 sm:px-4"
            style="animation-delay: 450ms"
          >
            <button
              @click="$router.push({ name: 'dashboard' })"
              class="w-full sm:w-auto min-w-[180px] px-8 py-3.5 sm:py-4 bg-primary text-primary-text rounded-full text-sm font-medium hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-primary/30 hover:-translate-y-1 active:scale-95"
            >
              Open Dashboard
            </button>
            <button
              @click="scrollToSection(featuresSection)"
              class="w-full sm:w-auto min-w-[180px] px-8 py-3.5 sm:py-4 bg-surface border border-border text-text-main rounded-full text-sm font-medium hover:bg-hover transition-all duration-300 hover:-translate-y-1 active:scale-95"
            >
              View Architecture
            </button>
          </div>
        </div>

        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] sm:w-[600px] sm:h-[600px] rounded-full blur-[80px] sm:blur-[120px] -z-10 pointer-events-none opacity-25 animate-float-slow"
          style="background: radial-gradient(circle, var(--color-primary), transparent)"
        ></div>
      </header>

      <section class="border-y border-border/50 bg-surface/40 backdrop-blur-md relative z-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-y-4 md:gap-y-0">
            <div
              v-for="(stat, i) in stats"
              :key="i"
              class="relative py-8 sm:py-12 flex flex-col items-center justify-center group cursor-default opacity-0 animate-fade-in-up"
              :style="{ animationDelay: `${500 + i * 100}ms` }"
            >
              <div
                class="absolute inset-x-4 inset-y-2 bg-text-main/5 rounded-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-out -z-10"
              ></div>

              <div
                class="text-4xl sm:text-5xl font-extralight tracking-tight text-text-main mb-2 transition-all duration-500 group-hover:-translate-y-1"
              >
                <span
                  v-if="stat.isNumber"
                  :ref="
                    (el) => {
                      if (el) statRefs[i] = el
                    }
                  "
                  :data-value="stat.value"
                  >0</span
                >
                <span v-else>{{ stat.value }}</span>
              </div>

              <div
                class="flex items-center gap-1.5 text-text-light group-hover:text-primary transition-colors duration-300"
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

      <section ref="featuresSection" class="py-16 sm:py-24 px-4 sm:px-6 relative z-10">
        <div class="max-w-6xl mx-auto">
          <div
            class="mb-10 sm:mb-16 text-center md:text-left border-b border-border pb-6 opacity-0 animate-fade-in-up"
            style="animation-delay: 200ms"
          >
            <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-text-main mb-2">
              System Workflow
            </h2>
            <p class="text-sm sm:text-base text-text-light font-light">
              Data Pipeline: Sensor Node → Gateway → Firebase → AI.
            </p>
          </div>

          <div class="mb-16 relative">
            <div
              class="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-border -translate-y-1/2 -z-10 opacity-0 animate-fade-in"
              style="animation-delay: 600ms"
            ></div>

            <div class="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
              <div
                class="w-full md:w-1/3 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center relative z-10 group hover:-translate-y-2 hover:shadow-md transition-all duration-500 opacity-0 animate-fade-in-up"
                style="animation-delay: 300ms"
              >
                <div
                  class="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-4 text-green-600 group-hover:scale-110 transition-transform"
                >
                  <Icon icon="ph:plant-bold" class="w-6 h-6" />
                </div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-text-light mb-1"
                  >Step 01</span
                >
                <h4 class="font-bold text-text-main text-lg">Sensors</h4>
                <p class="text-xs text-text-light mt-1">DHT22 & Rain Module</p>
              </div>

              <div
                class="text-border flex-shrink-0 z-10 bg-background p-2 rounded-full opacity-0 animate-fade-in"
                style="animation-delay: 500ms"
              >
                <Icon icon="ph:arrow-down-bold" class="w-6 h-6 md:hidden animate-bounce" />
                <Icon
                  icon="ph:arrow-right-bold"
                  class="hidden md:block w-6 h-6 animate-pulse-strong"
                />
              </div>

              <div
                class="w-full md:w-1/3 bg-primary p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col items-center text-center relative z-10 group hover:-translate-y-2 hover:shadow-primary/30 transition-all duration-500 opacity-0 animate-fade-in-up"
                style="animation-delay: 500ms"
              >
                <div
                  class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-primary-text group-hover:scale-110 transition-transform"
                >
                  <Icon icon="ph:cpu-bold" class="w-6 h-6" />
                </div>
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-primary-text/60 mb-1"
                  >Step 02</span
                >
                <h4 class="font-bold text-primary-text text-lg">ESP32 MCU</h4>
                <p class="text-xs text-primary-text/60 mt-1">JSON Serialization</p>
              </div>

              <div
                class="text-border flex-shrink-0 z-10 bg-background p-2 rounded-full opacity-0 animate-fade-in"
                style="animation-delay: 700ms"
              >
                <Icon icon="ph:arrow-down-bold" class="w-6 h-6 md:hidden animate-bounce" />
                <Icon
                  icon="ph:arrow-right-bold"
                  class="hidden md:block w-6 h-6 animate-pulse-strong"
                />
              </div>

              <div
                class="w-full md:w-1/3 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center relative z-10 group hover:-translate-y-2 hover:shadow-md transition-all duration-500 opacity-0 animate-fade-in-up"
                style="animation-delay: 700ms"
              >
                <div
                  class="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform"
                >
                  <Icon icon="ph:cloud-bold" class="w-6 h-6" />
                </div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-text-light mb-1"
                  >Step 03</span
                >
                <h4 class="font-bold text-text-main text-lg">Firebase</h4>
                <p class="text-xs text-text-light mt-1">Realtime Database</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div
              class="md:col-span-2 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-surface border border-border transition-all duration-500 group hover:shadow-xl hover:border-primary/30 hover:scale-[1.02] hover:-rotate-1"
            >
              <div class="flex items-start justify-between mb-6 sm:mb-8">
                <div
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-text-main group-hover:bg-primary group-hover:text-primary-text transition-colors duration-500 group-hover:rotate-12"
                >
                  <Icon icon="ph:wifi-high-bold" class="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span
                  class="px-3 py-1 rounded-full bg-background text-[9px] sm:text-[10px] font-bold text-text-light uppercase tracking-wide group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                  >Telemetry</span
                >
              </div>
              <h3 class="text-lg sm:text-xl font-medium text-text-main mb-3">
                Field Data Collection
              </h3>
              <p class="text-text-light text-sm leading-relaxed max-w-md">
                The ESP32 microcontroller continuously polls the <strong>DHT22</strong> and
                <strong>Rainfall Sensor</strong>. Data is filtered to remove noise before
                transmission.
              </p>
            </div>

            <div
              class="md:row-span-2 flex flex-col bg-surface/80 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500"
            >
              <div
                class="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow"
              ></div>

              <div class="flex items-center justify-between mb-6 flex-shrink-0 z-10">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-inner"
                  >
                    <Icon icon="ph:sparkle-fill" class="w-5 h-5" />
                  </div>
                  <div>
                    <h3 class="text-base sm:text-lg font-bold text-text-main leading-none mb-1">
                      Gemini Analysis
                    </h3>
                    <p
                      class="text-[10px] font-semibold text-purple-500/80 uppercase tracking-widest"
                    >
                      Based on latest sensors
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="relative flex h-2.5 w-2.5">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"
                    ></span>
                  </span>
                  <span
                    class="text-[10px] font-bold text-text-light/80 uppercase tracking-wider hidden sm:block"
                    >Live</span
                  >
                </div>
              </div>

              <div
                class="flex-grow overflow-y-auto space-y-6 relative z-10 custom-scrollbar pr-2 pl-1"
              >
                <div
                  class="relative pl-6 border-l-2 border-border hover:border-green-500 transition-colors duration-300 group/item"
                >
                  <div
                    class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface border-2 border-border group-hover/item:border-green-500 transition-colors duration-300"
                  ></div>
                  <h4
                    class="text-xs font-bold text-text-main mb-1 group-hover/item:text-green-600 transition-colors"
                  >
                    Crop Health & Maintenance
                  </h4>
                  <p class="text-xs text-text-light leading-relaxed">
                    Conditions are within normal ranges. Focus on routine maintenance and water
                    management to prevent waterlogging. Inspect plants for early pest signs.
                  </p>
                </div>

                <div
                  class="relative pl-6 border-l-2 border-border hover:border-orange-500 transition-colors duration-300 group/item"
                >
                  <div
                    class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface border-2 border-border group-hover/item:border-orange-500 transition-colors duration-300"
                  ></div>
                  <h4
                    class="text-xs font-bold text-text-main mb-1 group-hover/item:text-orange-500 transition-colors"
                  >
                    Pest & Disease Monitoring
                  </h4>
                  <p class="text-xs text-text-light leading-relaxed">
                    Current humidity (76%) is safe, but monitor closely. Maintain air circulation to
                    prevent Rice Blast or Bacterial Blight outbreaks.
                  </p>
                </div>

                <div
                  class="relative pl-6 border-l-2 border-border hover:border-blue-500 transition-colors duration-300 group/item"
                >
                  <div
                    class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface border-2 border-border group-hover/item:border-blue-500 transition-colors duration-300"
                  ></div>
                  <h4
                    class="text-xs font-bold text-text-main mb-1 group-hover/item:text-blue-500 transition-colors"
                  >
                    Weather Preparedness
                  </h4>
                  <p class="text-xs text-text-light leading-relaxed">
                    No active PAGASA alerts. Stay familiar with Yellow/Orange/Red rainfall
                    thresholds (7.5 - 30mm/hr) for rapid response.
                  </p>
                </div>
              </div>

              <div
                class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface to-transparent pointer-events-none z-20"
              ></div>
            </div>

            <div
              class="p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-surface border border-border transition-all duration-500 group hover:bg-hover hover:shadow-lg hover:scale-[1.02] hover:rotate-1"
            >
              <div
                class="mb-4 text-text-main group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500"
              >
                <Icon icon="ph:database-bold" class="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 class="text-base sm:text-lg font-medium text-text-main mb-2">Realtime DB</h3>
              <p class="text-text-light text-xs leading-relaxed">
                Low-latency synchronization ensures the dashboard reflects current field conditions
                instantly.
              </p>
            </div>

            <div
              class="p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-surface border border-border transition-all duration-500 group hover:bg-hover hover:shadow-lg hover:scale-[1.02] hover:-rotate-1"
            >
              <div
                class="mb-4 text-text-main group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"
              >
                <Icon icon="ph:bell-ringing-bold" class="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 class="text-base sm:text-lg font-medium text-text-main mb-2">Smart Alerts</h3>
              <p class="text-text-light text-xs leading-relaxed">
                Immediate Email and SMS notifications when the Rainfall Sensor detects active
                precipitation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        ref="hardwareSection"
        class="py-16 sm:py-24 bg-surface px-4 sm:px-6 border-t border-border relative z-10"
      >
        <div class="max-w-5xl mx-auto">
          <div
            class="text-center mb-10 sm:mb-16 opacity-0 animate-fade-in-up"
            style="animation-delay: 200ms"
          >
            <h2 class="text-2xl sm:text-3xl font-semibold text-text-main mb-3">Hardware Specs</h2>
            <p class="text-sm text-text-light">
              Industrial-grade functionality, accessible components.
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 mt-8 sm:mt-12">
            <div
              v-for="(item, i) in hardwareComponents"
              :key="i"
              class="p-4 sm:p-6 rounded-3xl bg-background border border-border flex flex-col items-center text-center group transition-all duration-500 hover:bg-surface hover:shadow-xl hover:-translate-y-2 opacity-0 animate-fade-in-up"
              :style="{ animationDelay: `${400 + i * 100}ms` }"
            >
              <div
                class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary group-hover:text-primary-text transition-all duration-300 group-hover:rotate-6 group-hover:scale-110"
              >
                <Icon
                  :icon="item.icon"
                  class="w-6 h-6 sm:w-7 sm:h-7 text-text-light group-hover:text-primary-text transition-colors"
                />
              </div>
              <h3 class="font-bold text-xs sm:text-sm text-text-main mb-1">{{ item.name }}</h3>
              <p class="text-[9px] sm:text-[10px] text-text-light uppercase tracking-wide">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        class="py-16 sm:py-32 px-4 sm:px-6 bg-surface border-t border-border relative overflow-hidden"
      >
        <div
          class="absolute inset-0 opacity-[0.05] mix-blend-multiply pointer-events-none"
          style="background-image: url('https://grainy-gradients.vercel.app/noise.svg')"
        ></div>
        <div
          class="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-float-slow"
          style="animation-delay: -5s"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-float-slow"
        ></div>

        <div
          class="max-w-3xl mx-auto text-center relative z-10 opacity-0 animate-fade-in-up"
          style="animation-delay: 300ms"
        >
          <h2 class="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 sm:mb-6 text-text-main">
            Deploy today.
          </h2>
          <p class="text-text-light mb-8 sm:mb-10 text-base sm:text-lg font-light">
            Join the agricultural modernization initiative.
          </p>

          <div
            class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <button
              @click="$router.push({ name: 'signup' })"
              class="w-full sm:w-auto min-w-[160px] px-8 py-3.5 sm:py-4 bg-primary text-primary-text rounded-full font-bold hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1"
            >
              Create Account
            </button>
            <button
              @click="$router.push({ name: 'login' })"
              class="w-full sm:w-auto min-w-[160px] px-8 py-3.5 sm:py-4 border border-border text-text-main bg-transparent hover:bg-hover rounded-full font-medium transition-all duration-300 hover:-translate-y-1"
            >
              Live Demo
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer class="bg-surface border-t border-border py-10 px-6 relative z-10">
      <div class="max-w-6xl mx-auto text-center">
        <p class="text-text-light text-sm font-medium">
          &copy; {{ currentYear }} Climate Monitoring. All Rights Reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Icon } from '@iconify/vue'

// --- 1. STATE MANAGEMENT ---
const scrollY = ref(0)
const isScrolled = computed(() => scrollY.value > 20)
const featuresSection = ref(null)
const hardwareSection = ref(null)
const mobileMenuOpen = ref(false)
const statRefs = ref([])
const currentYear = new Date().getFullYear()

// --- 2. DATA CONSTANTS ---
const hardwareComponents = [
  { name: 'ESP32-WROOM', desc: 'Controller', icon: 'ph:cpu' },
  { name: 'DHT22', desc: 'Temp / Hum', icon: 'ph:thermometer-simple' },
  { name: 'Rain Module', desc: 'Precipitation', icon: 'ph:cloud-rain' },
  { name: 'Solar Module', desc: '12V 15W', icon: 'ph:sun-dim' },
]

// UPDATED STATS DATA WITH ICONS
const stats = [
  { value: '99%', label: 'Uptime', isNumber: false, icon: 'ph:lightning-fill' },
  { value: 15, label: 'Min Rate', isNumber: true, icon: 'ph:timer-fill' },
  { value: 24, label: 'Hr History', isNumber: true, icon: 'ph:clock-counter-clockwise-fill' },
  { value: 3, label: 'Active Nodes', isNumber: true, icon: 'ph:broadcast-fill' },
]

// --- 3. METHODS ---
const handleScroll = () => {
  scrollY.value = window.scrollY
}

const scrollToSection = (elementRef) => {
  if (elementRef) {
    const yOffset = -100 // Account for fixed header
    const y = elementRef.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
    mobileMenuOpen.value = false
  }
}

const initCounters = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target
          const targetValue = parseInt(el.getAttribute('data-value'))
          let startTimestamp = null
          const duration = 2000
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 4)
            el.innerText = Math.floor(ease * targetValue)
            if (progress < 1) window.requestAnimationFrame(step)
            else el.innerText = targetValue
          }
          window.requestAnimationFrame(step)
          observer.unobserve(el)
        }
      })
    },
    { threshold: 0.5 },
  )

  statRefs.value.forEach((el) => {
    if (el) observer.observe(el)
  })
}

// --- 4. LIFECYCLE ---
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  initCounters()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
@import 'tailwindcss';

/* ============================================
   VUE THEME COLOR PALETTE (Matches config)
   ============================================ */
:root {
  --vt-c-white: #ffffff;
  --vt-c-white-soft: #f8f8f8;
  --vt-c-white-mute: #f2f2f2;
  --vt-c-black: #181818;
  --vt-c-black-soft: #222222;
  --vt-c-black-mute: #282828;

  /* LIGHT MODE VARIABLES */
  --color-background: #f8f9fa;
  --color-surface: var(--vt-c-white-mute);
  --color-primary: #1a73e8;
  --color-text-main: #202124;
  --color-text-light: #5f6368;
  --color-hover: #e8eaed;
  --color-border: #e5e7eb;
  --color-primary-text: #ffffff;

  /* Custom Green */
  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-600: #16a34a;

  /* Custom Purple */
  --color-purple-200: #ddd6fe;
  --color-purple-900: #5b21b6;
}

html.dark {
  /* DARK MODE VARIABLES */
  --color-background: #000000;
  --color-surface: #121212;
  --color-primary: #8ab4f8;
  --color-text-main: #e8eaed;
  --color-text-light: #9aa0a6;
  --color-hover: #2a2a2a;
  --color-border: #374151;
  --color-primary-text: #1a1a1a;

  --color-green-50: #0d1e13;
  --color-green-100: #1a2d20;
  --color-green-600: #7be0a3;

  --color-purple-200: #3a3255;
  --color-purple-900: #1e1b2e;
}

/* Smooth Transition for Theme Switch */
body {
  background-color: var(--color-background);
  color: var(--color-text-main);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700&display=swap');

.font-sans {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Custom Scrollbar for Gemini Card */
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

/* === ANIMATIONS === */

/* 1. General Entrance Fade In Up */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-fade-in-up {
  animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 2. Simple Fade In */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fade-in 1s ease-out forwards;
}

/* 3. Slow Floating Background */
@keyframes float-slow {
  0%,
  100% {
    transform: translate(-50%, -50%) rotate(0deg) scale(1);
  }
  33% {
    transform: translate(-45%, -55%) rotate(5deg) scale(1.05);
  }
  66% {
    transform: translate(-55%, -45%) rotate(-5deg) scale(0.95);
  }
}
.animate-float-slow {
  animation: float-slow 20s infinite ease-in-out;
}

/* 4. Stronger Pulse for Arrows */
@keyframes pulse-strong {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}
.animate-pulse-strong {
  animation: pulse-strong 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 5. Slow Bounce for Location Icon */
@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}
.animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}

/* 6. Slow Pulse for AI Glow (New) */
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}
.animate-pulse-slow {
  animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Easing for mobile menu */
.ease-spring {
  transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6);
}
</style>
