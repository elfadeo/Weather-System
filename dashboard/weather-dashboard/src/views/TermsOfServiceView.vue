<template>
  <main
    role="main"
    aria-labelledby="tos-heading"
    class="font-sans text-text-main p-4 sm:p-6 lg:p-8 min-h-screen"
  >
    <div class="max-w-4xl mx-auto bg-surface rounded-2xl shadow-md p-6 sm:p-8">
      <nav class="mb-6 no-print">
        <router-link
          to="/"
          class="inline-flex items-center text-primary hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1"
        >
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </router-link>
      </nav>

      <header class="mb-8">
        <h1 id="tos-heading" class="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
        <p class="text-text-light text-sm">Effective Date: {{ lastUpdatedFormatted }}</p>
      </header>

      <!-- INFO NOTICE -->
      <div
        class="mb-8 p-4 bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-dark)] border-l-4 border-primary rounded"
      >
        <p class="text-sm text-text-light">
          <strong>Welcome to AgriSmart Weather Monitoring System.</strong> By accessing or using our
          service, you agree to be bound by these Terms of Service. Please read them carefully
          before using the platform.
        </p>
      </div>

      <div class="space-y-8 text-base leading-relaxed">
        <section v-for="section in sections" :key="section.id">
          <h2 class="text-xl sm:text-2xl font-semibold mb-4 text-primary">
            {{ section.number }}. {{ section.title }}
          </h2>
          <div class="text-text-light space-y-3">
            <p v-for="(paragraph, index) in section.content" :key="index">{{ paragraph }}</p>
          </div>
        </section>

        <!-- CONTACT INFORMATION -->
        <section class="mt-12 pt-8 border-t-2 border-border-light dark:border-border-dark">
          <h2 class="text-xl font-semibold mb-4 text-primary">Contact Information</h2>
          <div class="bg-surface rounded-lg p-6 space-y-2 shadow-sm">
            <p class="text-text-light">
              If you have any questions or concerns about these Terms of Service, please contact us:
            </p>
            <p class="text-text-light">
              <strong>Email:</strong>
              <a
                href="mailto:ponce.rn952@s.msumain.edu.ph"
                class="text-primary hover:underline ml-2"
              >
                ponce.rn952@s.msumain.edu.ph
              </a>
            </p>
            <p class="text-text-light"><strong>Location:</strong> Marawi City, Philippines</p>
          </div>
        </section>

        <!-- SUCCESS NOTICE -->
        <div
          class="mt-8 p-4 bg-[var(--color-green-light)] dark:bg-[var(--color-green-dark)] border-l-4 border-[var(--color-green-dark)] rounded"
        >
          <p class="text-sm text-text-light">
            <strong
              >By using this service, you acknowledge that you have read, understood, and agree to
              be bound by these Terms of Service.</strong
            >
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'

const lastUpdatedDate = new Date('2024-12-02')

const lastUpdatedFormatted = computed(() =>
  lastUpdatedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const sections = [
  {
    id: 1,
    number: 1,
    title: 'Acceptance of Terms',
    content: [
      'By creating an account, accessing, or using the AgriSmart Weather Monitoring System ("Service"), you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.',
      'These Terms apply to all users, including farmers, agricultural organizations, researchers, and any other individuals or entities accessing the platform.',
    ],
  },
  {
    id: 2,
    number: 2,
    title: 'Description of Service',
    content: [
      'AgriSmart Weather Monitoring System provides real-time weather monitoring services specifically designed for rice farming in the Philippines. The Service includes real-time sensor data collection, automated weather alerts via email and SMS, disease risk predictions, historical weather data analysis, and customizable threshold settings.',
    ],
  },
  {
    id: 3,
    number: 3,
    title: 'User Accounts and Registration',
    content: [
      'To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration.',
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
      'You must notify us immediately of any unauthorized access or security breach. We are not liable for losses caused by unauthorized use of your account.',
    ],
  },
  {
    id: 4,
    number: 4,
    title: 'User Responsibilities',
    content: [
      'You are responsible for maintaining accurate farm location and contact information for proper weather monitoring and alerts.',
      'You must use the Service in compliance with all applicable Philippine laws and regulations.',
      'You agree not to misuse the Service, including attempting to access unauthorized areas, interfering with system operations, or transmitting harmful code.',
      'You shall not use the Service for any unlawful purpose or to harm others.',
    ],
  },
  {
    id: 5,
    number: 5,
    title: 'Service Availability and Limitations',
    content: [
      'While we strive for 99% uptime, we do not guarantee uninterrupted access to the Service. Weather data may be delayed due to sensor connectivity or network issues.',
      'The Service is provided "as is" without warranties of any kind. Weather predictions and disease risk assessments are advisory only and should not be the sole basis for critical farming decisions.',
      'We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.',
      'Scheduled maintenance will be announced in advance when possible, but emergency maintenance may occur without prior notice.',
    ],
  },
  {
    id: 6,
    number: 6,
    title: 'Intellectual Property Rights',
    content: [
      'All content, features, and functionality of the Service, including but not limited to software, text, graphics, logos, and algorithms, are owned by AgriSmart Weather Monitoring System and protected by Philippine and international copyright laws.',
      'You may not reproduce, distribute, modify, or create derivative works without our express written permission.',
      'Weather data collected from your sensors remains your property, but you grant us a non-exclusive, worldwide license to use it for Service improvement and agricultural research (in anonymized form only).',
    ],
  },
  {
    id: 7,
    number: 7,
    title: 'Limitation of Liability',
    content: [
      'To the maximum extent permitted by Philippine law, AgriSmart Weather Monitoring System shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, crops, or other intangible losses arising from your use of or inability to use the Service.',
      'We are not liable for crop losses, financial damages, or other consequences resulting from reliance on weather data, predictions, or alerts provided by the Service.',
      'Our total liability for any claims related to the Service shall not exceed the amount you paid for the Service in the past 12 months, or PHP 1,000 if the Service is free.',
      'Some jurisdictions do not allow limitations on liability, so these limitations may not apply to you.',
    ],
  },
  {
    id: 8,
    number: 8,
    title: 'Indemnification',
    content: [
      'You agree to indemnify, defend, and hold harmless AgriSmart Weather Monitoring System, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.',
    ],
  },
  {
    id: 9,
    number: 9,
    title: 'Termination',
    content: [
      'You may terminate your account at any time by contacting us at ponce.rn952@s.msumain.edu.ph or through your account settings.',
      'We reserve the right to suspend or terminate your account immediately, without prior notice, if you violate these Terms, engage in fraudulent or abusive behavior, or for any other reason at our sole discretion.',
      'Upon termination, your right to access the Service will cease immediately. We may delete your account data after 30 days, though some data may be retained as required by law or for legitimate business purposes (see Privacy Policy).',
      'Sections of these Terms that by their nature should survive termination shall survive, including intellectual property rights, limitation of liability, and dispute resolution.',
    ],
  },
  {
    id: 10,
    number: 10,
    title: 'Payment Terms (If Applicable)',
    content: [
      'If the Service requires payment, you agree to pay all applicable fees as described on our pricing page.',
      'All fees are in Philippine Pesos (PHP) unless otherwise stated. Payments are non-refundable except as required by law.',
      'We reserve the right to change our pricing with 30 days advance notice. Continued use of the Service after a price change constitutes acceptance of the new fees.',
      'Failure to pay fees may result in suspension or termination of your account.',
    ],
  },
  {
    id: 11,
    number: 11,
    title: 'Changes to Terms',
    content: [
      'We may modify these Terms at any time to reflect changes in our practices, legal requirements, or Service features.',
      'We will notify you of material changes via email or dashboard notification at least 15 days before they take effect.',
      'Your continued use of the Service after changes become effective constitutes acceptance of the modified Terms.',
      'If you do not agree to the changes, you must stop using the Service and may close your account.',
    ],
  },
  {
    id: 12,
    number: 12,
    title: 'Governing Law and Dispute Resolution',
    content: [
      'These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without regard to its conflict of law principles.',
      'Any disputes arising from these Terms or your use of the Service shall be resolved first through good-faith negotiation between the parties.',
      'If negotiation fails, disputes shall be subject to the exclusive jurisdiction of the courts of Lanao del Sur, Philippines.',
      'You agree to waive any right to a jury trial and to participate in class action lawsuits.',
    ],
  },
  {
    id: 13,
    number: 13,
    title: 'Third-Party Services',
    content: [
      'The Service may integrate with third-party services (e.g., Firebase, Semaphore SMS, email providers). We are not responsible for the availability, accuracy, or content of these third-party services.',
      'Your use of third-party services is subject to their respective terms and privacy policies.',
      'We do not endorse or assume liability for any third-party services linked from our platform.',
    ],
  },
  {
    id: 14,
    number: 14,
    title: 'Force Majeure',
    content: [
      'We shall not be liable for any failure or delay in performing our obligations under these Terms due to circumstances beyond our reasonable control, including natural disasters, government actions, telecommunications failures, power outages, or other force majeure events.',
    ],
  },
  {
    id: 15,
    number: 15,
    title: 'Severability',
    content: [
      'If any provision of these Terms is found to be invalid or unenforceable by a court of law, the remaining provisions shall continue in full force and effect.',
      'The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.',
    ],
  },
  {
    id: 16,
    number: 16,
    title: 'Entire Agreement',
    content: [
      'These Terms, together with our Privacy Policy, constitute the entire agreement between you and AgriSmart Weather Monitoring System regarding the use of the Service.',
      'These Terms supersede all prior agreements, understandings, or communications, whether written or oral.',
    ],
  },
  {
    id: 17,
    number: 17,
    title: 'Contact Us',
    content: [
      'For questions, concerns, or feedback regarding these Terms of Service, please contact us at ponce.rn952@s.msumain.edu.ph or visit our contact page.',
    ],
  },
]
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }

  main {
    padding: 0;
  }

  h1,
  h2 {
    page-break-after: avoid;
  }

  section {
    page-break-inside: avoid;
  }
}
</style>
