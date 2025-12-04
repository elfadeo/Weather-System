<template>
  <main
    role="main"
    aria-labelledby="privacy-heading"
    class="font-sans text-text-main p-4 sm:p-6 lg:p-8 min-h-screen"
  >
    <div class="max-w-4xl mx-auto bg-surface rounded-2xl shadow-md p-6 sm:p-8">
      <!-- Back Navigation -->
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

      <!-- Header -->
      <header class="mb-8">
        <h1 id="privacy-heading" class="text-3xl sm:text-4xl font-bold mb-2">
          Privacy Policy
        </h1>
        <p class="text-text-light text-sm">Effective Date: {{ lastUpdatedFormatted }}</p>
      </header>

      <!-- Introduction -->
      <div class="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary rounded">
        <p class="text-sm text-text-light">
          <strong>Your privacy is important to us.</strong> This Privacy Policy explains how
          AgriSmart Weather Monitoring System collects, uses, shares, and protects your personal
          information. We are committed to transparency and compliance with the Data Privacy Act of
          2012 (Republic Act No. 10173) of the Philippines.
        </p>
      </div>

      <!-- Content -->
      <div class="space-y-8 text-base leading-relaxed">
        <section v-for="section in sections" :key="section.id">
          <h2 class="text-xl sm:text-2xl font-semibold mb-4 text-primary">
            {{ section.number }}. {{ section.title }}
          </h2>
          <div class="text-text-light space-y-3">
            <p v-for="(paragraph, index) in section.content" :key="index">{{ paragraph }}</p>
          </div>
        </section>

        <!-- Data Protection Officer -->
        <section class="mt-12 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-primary">
            Contact Our Data Protection Officer
          </h2>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
            <p class="text-text-light">
              For privacy-related inquiries, data access requests, or complaints:
            </p>
            <p class="text-text-light">
              <strong>Email:</strong>
              <a href="mailto:ponce.rn952@s.msumain.edu.ph" class="text-primary hover:underline ml-2">
                ponce.rn952@s.msumain.edu.ph
              </a>
            </p>
            <p class="text-text-light">
              <strong>Data Protection Officer:</strong> AgriSmart Weather Monitoring Team
            </p>
            <p class="text-text-light">
              <strong>Institution:</strong> Mindanao State University - Main Campus
            </p>
            <p class="text-text-light">
              <strong>Location:</strong> Marawi City, Philippines
            </p>
            <p
              class="text-sm text-text-light mt-4 pt-4 border-t border-gray-300 dark:border-gray-600"
            >
              You also have the right to file a complaint with the
              <a
                href="https://www.privacy.gov.ph"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >
                National Privacy Commission (NPC)
              </a>
              of the Philippines if you believe your privacy rights have been violated.
            </p>
          </div>
        </section>

        <!-- Acceptance Notice -->
        <div class="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <p class="text-sm text-text-light">
            <strong
              >By using our Service, you acknowledge that you have read and understood this Privacy
              Policy and consent to the collection, use, and disclosure of your information as
              described herein.</strong
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
    day: 'numeric'
  })
)

const sections = [
  {
    id: 1,
    number: 1,
    title: 'Information We Collect',
    content: [
      'We collect the following types of information to provide and improve our weather monitoring services:',
      'A. Personal Information:',
      '• Name, email address, and phone number (for account creation and alerts)',
      '• Location information (farm location for localized weather monitoring)',
      '• Account credentials (username and encrypted password)',
      '• Communication preferences (email/SMS notification settings)',
      'B. Weather Sensor Data:',
      '• Real-time temperature readings (°C)',
      '• Humidity levels (%)',
      '• Rainfall measurements (mm/hour)',
      '• Sensor timestamps and device identifiers',
      '• Historical weather patterns and trends',
      'C. Usage Data:',
      '• Login timestamps and IP addresses',
      '• Dashboard interactions and feature usage',
      '• Device information (browser type, operating system)',
      '• Pages visited and time spent on the platform',
      'D. Cookies and Tracking Technologies:',
      '• Session cookies for authentication',
      '• Analytics cookies to understand user behavior (if enabled)',
      '• Local storage for dashboard preferences'
    ]
  },
  {
    id: 2,
    number: 2,
    title: 'How We Use Your Information',
    content: [
      'We use the collected information for the following purposes:',
      '• Service Delivery: To provide real-time weather monitoring, alerts, and agricultural insights',
      '• Notifications: To send critical weather alerts via email and SMS based on your preferences',
      '• Account Management: To create, maintain, and secure your user account',
      '• Personalization: To customize dashboard settings, thresholds, and alert preferences',
      '• Analytics: To analyze weather patterns, disease risks, and improve agricultural predictions',
      '• Communication: To send service updates, maintenance notices, and respond to inquiries',
      '• Legal Compliance: To comply with legal obligations and enforce our Terms of Service',
      '• Security: To detect and prevent fraud, abuse, and unauthorized access',
      '• Research: To conduct agricultural research and improve rice farming practices (anonymized data only)'
    ]
  },
  {
    id: 3,
    number: 3,
    title: 'Legal Basis for Processing (Philippine Data Privacy Act)',
    content: [
      'Under the Data Privacy Act of 2012, we process your personal information based on the following legal grounds:',
      '• Consent: You have explicitly consented to the processing of your personal data (e.g., enabling SMS notifications)',
      '• Contract: Processing is necessary for the performance of our service agreement with you',
      '• Legitimate Interests: We have a legitimate interest in providing weather monitoring services, improving agricultural outcomes, and ensuring platform security',
      '• Legal Obligation: We may process data to comply with legal requirements or court orders'
    ]
  },
  {
    id: 4,
    number: 4,
    title: 'How We Share Your Information',
    content: [
      'We do not sell, rent, or trade your personal information. However, we may share your data with:',
      'A. Service Providers (Data Processors):',
      '• Firebase (Google Cloud): For secure data storage, authentication, and real-time database synchronization',
      '• Semaphore SMS API: For sending weather alert text messages to your registered phone number',
      '• Email Service Providers (Gmail/SendGrid): For delivering weather alerts and service notifications',
      'B. Legal Requirements:',
      '• Government authorities, law enforcement, or courts when required by law',
      '• In response to legal processes (subpoenas, court orders)',
      '• To protect our rights, property, or safety, or that of our users',
      'C. Business Transfers:',
      '• In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity (you will be notified in advance)',
      'We ensure all third-party service providers comply with data protection standards and sign Data Processing Agreements to safeguard your information.'
    ]
  },
  {
    id: 5,
    number: 5,
    title: 'Data Security Measures',
    content: [
      'We implement industry-standard technical and organizational measures to protect your data:',
      '• Encryption: Data is encrypted in transit (TLS/SSL) and at rest (AES-256)',
      '• Authentication: Secure Firebase Authentication with password hashing (bcrypt)',
      '• Access Controls: Role-based access restrictions; only authorized personnel can access personal data',
      '• Firewalls and Monitoring: Network security measures and intrusion detection systems',
      '• Regular Audits: Periodic security assessments and vulnerability testing',
      '• Data Backups: Regular backups stored securely to prevent data loss',
      'However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.'
    ]
  },
  {
    id: 6,
    number: 6,
    title: 'Data Retention',
    content: [
      'We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy:',
      '• Account Data: Retained while your account is active and for 1 year after account closure (for legal compliance)',
      '• Weather Sensor Data: Retained for 5 years to support long-term agricultural research and historical analysis',
      '• Communication Logs: Email and SMS logs retained for 2 years for audit and support purposes',
      '• Usage Data: Anonymized analytics data may be retained indefinitely for research',
      'You may request deletion of your data at any time by contacting our Data Protection Officer. We will delete your information within 30 days, except where retention is required by law.'
    ]
  },
  {
    id: 7,
    number: 7,
    title: 'Your Data Privacy Rights (Under Philippine Law)',
    content: [
      'Under the Data Privacy Act of 2012, you have the following rights:',
      '• Right to Be Informed: You have the right to know how your data is collected, used, and shared (this Privacy Policy)',
      '• Right to Access: You can request a copy of your personal data we hold',
      '• Right to Rectification: You can update or correct inaccurate personal information',
      '• Right to Erasure/Blocking: You can request deletion or blocking of your data (subject to legal retention requirements)',
      '• Right to Object: You can object to the processing of your data for direct marketing or other purposes',
      '• Right to Data Portability: You can request your data in a machine-readable format to transfer to another service',
      '• Right to Withdraw Consent: You can withdraw your consent for data processing at any time (may affect service functionality)',
      'To exercise these rights, contact us at ponce.rn952@s.msumain.edu.ph. We will respond within 15 working days as required by the National Privacy Commission.'
    ]
  },
  {
    id: 8,
    number: 8,
    title: 'Cookies and Tracking Technologies',
    content: [
      'We use cookies and similar technologies to enhance your experience:',
      '• Essential Cookies: Required for authentication and core functionality (cannot be disabled)',
      '• Analytics Cookies: Used to understand user behavior and improve the platform (can be disabled)',
      '• Preference Cookies: Store your dashboard settings and theme preferences',
      'You can control cookie settings through your browser. However, disabling essential cookies may impair service functionality. We do not use third-party advertising cookies.'
    ]
  },
  {
    id: 9,
    number: 9,
    title: 'Third-Party Links',
    content: [
      'Our Service may contain links to third-party websites (e.g., IRRI resources, PAGASA weather updates). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.'
    ]
  },
  {
    id: 10,
    number: 10,
    title: "Children's Privacy",
    content: [
      'Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately, and we will delete the information within 30 days.'
    ]
  },
  {
    id: 11,
    number: 11,
    title: 'International Data Transfers',
    content: [
      'Your data may be transferred to and processed in countries outside the Philippines (e.g., Google Cloud servers). We ensure that such transfers comply with the Data Privacy Act through:',
      '• Using service providers with adequate data protection measures',
      '• Signing Standard Contractual Clauses or Data Processing Agreements',
      '• Ensuring recipients are subject to equivalent data protection laws',
      'Firebase (Google Cloud) complies with international standards including GDPR and ISO 27001.'
    ]
  },
  {
    id: 12,
    number: 12,
    title: 'Data Breach Notification',
    content: [
      'In the event of a data breach that affects your personal information, we will:',
      '• Notify you via email within 72 hours of discovering the breach',
      '• Inform the National Privacy Commission (NPC) as required by law',
      '• Describe the nature of the breach, the data affected, and actions taken to mitigate harm',
      '• Provide recommendations on steps you can take to protect yourself',
      'We maintain an incident response plan and conduct regular security drills to minimize breach risks.'
    ]
  },
  {
    id: 13,
    number: 13,
    title: 'Changes to This Privacy Policy',
    content: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or service features. When we make material changes, we will:',
      '• Update the "Effective Date" at the top of this page',
      '• Notify you via email or dashboard notification',
      '• Request your consent if required by law',
      'Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy. We encourage you to review this page periodically.'
    ]
  },
  {
    id: 14,
    number: 14,
    title: 'Compliance with Philippine Data Privacy Act',
    content: [
      'AgriSmart Weather Monitoring System is committed to full compliance with the Data Privacy Act of 2012 (RA 10173) and regulations issued by the National Privacy Commission (NPC). We:',
      '• Register with the NPC as a Personal Information Controller (if required)',
      '• Implement the NPC\'s privacy and security framework',
      '• Conduct regular Data Privacy Impact Assessments (DPIAs)',
      '• Train our staff on data protection principles',
      '• Maintain records of processing activities',
      'For more information about your rights under Philippine law, visit the National Privacy Commission website: www.privacy.gov.ph'
    ]
  }
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
