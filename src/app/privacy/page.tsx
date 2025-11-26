import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | PawStudio',
  description: 'Privacy Policy for PawStudio - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🐾</span>
              <span className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">PawStudio</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: November 26, 2025</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to PawStudio ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at paw-studio.com and our AI-powered pet photo transformation service (collectively, the "Service").
              </p>
              <p className="text-gray-600 leading-relaxed">
                Please read this Privacy Policy carefully. By using the Service, you consent to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree with the terms of this policy, please do not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.1 Personal Information You Provide</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect personal information that you voluntarily provide when you:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Create an Account:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Make a Purchase:</strong> Payment information (processed securely by Stripe - we do not store full card details)</li>
                <li><strong>Upload Content:</strong> Pet photos you upload to the Service</li>
                <li><strong>Contact Us:</strong> Any information you include in communications with us</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you access the Service, we may automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Device Information:</strong> Device type, operating system, browser type and version</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns</li>
                <li><strong>IP Address:</strong> Your Internet Protocol address</li>
                <li><strong>Cookies and Similar Technologies:</strong> Information collected via cookies, pixels, and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.3 Image Data</h3>
              <p className="text-gray-600 leading-relaxed">
                When you upload pet photos, we process these images through our AI system. We do not use facial recognition technology on human faces. Our AI is designed specifically for pet photo transformation and does not analyze or store biometric data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide, operate, and maintain the Service</li>
                <li>Process your pet photo transformations using AI technology</li>
                <li>Process payments and manage your credit balance</li>
                <li>Create and manage your user account</li>
                <li>Send you important updates about the Service</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Monitor and analyze usage trends to improve the Service</li>
                <li>Detect, prevent, and address fraud, abuse, and security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Share Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., Stripe for payment processing, Backblaze for image storage, Black Forest Labs for AI processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property, and that of our users</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition</li>
                <li><strong>With Your Consent:</strong> When you have given us explicit consent to share your information</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>We do not sell your personal information to third parties.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide the Service to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce our agreements</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>Uploaded Images:</strong> Original and transformed images are stored in your account until you delete them or close your account. You can delete individual images at any time through your gallery.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>Account Data:</strong> If you close your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing</li>
                <li>Access controls and authentication</li>
                <li>Regular security assessments</li>
                <li>Secure cloud infrastructure</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">7.1 General Rights</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">7.2 California Residents (CCPA/CPRA)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you are a California resident, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Know what personal information we collect, use, and disclose</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of the "sale" or "sharing" of your personal information (note: we do not sell personal information)</li>
                <li>Non-discrimination for exercising your privacy rights</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                We honor Global Privacy Control (GPC) signals as a valid opt-out request.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">7.3 European Economic Area (GDPR)</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                PawStudio is based in Estonia, a member of the European Union. If you are in the EEA, UK, or Switzerland, you have additional rights under GDPR:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Right to withdraw consent at any time</li>
                <li>Right to lodge a complaint with a supervisory authority (for Estonia: Estonian Data Protection Inspectorate - Andmekaitse Inspektsioon)</li>
                <li>Right to restrict processing</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Our legal bases for processing include: performance of contract, legitimate interests, consent, and compliance with legal obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to collect information and improve the Service. Types of cookies we use:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the Service to function properly (authentication, security)</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                You can control cookies through your browser settings. Note that disabling certain cookies may affect the functionality of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our Service integrates with the following third-party services:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Stripe:</strong> For payment processing (<a href="https://stripe.com/privacy" className="text-orange-600 hover:text-orange-700">Privacy Policy</a>)</li>
                <li><strong>Backblaze B2:</strong> For image storage (<a href="https://www.backblaze.com/company/privacy.html" className="text-orange-600 hover:text-orange-700">Privacy Policy</a>)</li>
                <li><strong>Black Forest Labs (FLUX):</strong> For AI image processing</li>
                <li><strong>Resend:</strong> For email delivery (<a href="https://resend.com/privacy" className="text-orange-600 hover:text-orange-700">Privacy Policy</a>)</li>
                <li><strong>Vercel:</strong> For hosting (<a href="https://vercel.com/legal/privacy-policy" className="text-orange-600 hover:text-orange-700">Privacy Policy</a>)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                These third parties have their own privacy policies governing how they handle your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                PawStudio is based in Estonia, European Union. Your information may be transferred to and processed in countries other than your country of residence, including the United States where some of our service providers are located. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information, including standard contractual clauses approved by the European Commission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information promptly. If you believe we have collected information from a child under 13, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. For significant changes, we may also send you an email notification. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have questions about this Privacy Policy, want to exercise your privacy rights, or have concerns about our data practices, please contact us at:
              </p>
              <p className="text-gray-600 leading-relaxed">
                <strong>Email:</strong> privacy@paw-studio.com<br />
                <strong>General Support:</strong> support@paw-studio.com<br />
                <strong>Website:</strong> <a href="https://paw-studio.com" className="text-orange-600 hover:text-orange-700">paw-studio.com</a>
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                We will respond to your request within 30 days, or sooner as required by applicable law.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <Link href="/terms" className="text-orange-600 hover:text-orange-700">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/" className="text-orange-600 hover:text-orange-700">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} PawStudio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
