import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | PawStudio',
  description: 'Terms of Service for PawStudio - AI-powered pet photo transformation service.',
}

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: November 26, 2025</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to PawStudio. By accessing or using our website at paw-studio.com (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
              <p className="text-gray-600 leading-relaxed">
                PawStudio reserves the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                PawStudio is an AI-powered pet photo transformation service that allows users to upload photos of their pets and apply various AI-generated scenes and effects. Our Service uses advanced artificial intelligence technology (FLUX.1 Kontext Pro) to process and transform your pet images.
              </p>
              <p className="text-gray-600 leading-relaxed">
                The Service includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
                <li>Photo upload and storage functionality</li>
                <li>AI-powered image transformation with various scene options</li>
                <li>Image download in high resolution</li>
                <li>Credit-based payment system</li>
                <li>User account management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                You must be at least 18 years old to create an account. If you are under 18, you may only use the Service with the consent and supervision of a parent or legal guardian.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Credits and Payments</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                PawStudio operates on a credit-based system:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>New users receive their first photo transformation free</li>
                <li>Each AI photo transformation costs 1 credit (unless otherwise specified)</li>
                <li>Credits can be purchased through our payment processor (Stripe)</li>
                <li>Credits do not expire and are non-transferable</li>
                <li>All purchases are final and non-refundable, except as required by law</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Prices are subject to change. We will notify users of any price changes before they take effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Content and Licensing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Your Content:</strong> You retain ownership of the original photos you upload to PawStudio. By uploading content, you grant PawStudio a limited, non-exclusive, royalty-free license to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Process and transform your images using our AI technology</li>
                <li>Store your images on our servers for Service functionality</li>
                <li>Display transformed images in your account gallery</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>Transformed Images:</strong> You own the rights to the AI-transformed images created through our Service for personal and commercial use, subject to these Terms.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>Consent Requirements:</strong> You represent and warrant that you have all necessary rights to upload and process the images you submit, including the right to photograph the pets depicted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Uses</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Upload images containing illegal, harmful, or inappropriate content</li>
                <li>Upload images of humans or content that is not pet-related</li>
                <li>Generate content that promotes violence, discrimination, or illegal activities</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Attempt to reverse engineer, decompile, or extract our AI models or algorithms</li>
                <li>Use automated systems (bots, scrapers) to access the Service</li>
                <li>Circumvent or manipulate our credit system</li>
                <li>Resell or redistribute access to the Service without authorization</li>
                <li>Harass, abuse, or harm PawStudio staff or other users</li>
                <li>Interfere with or disrupt the Service or servers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. AI-Generated Content Disclaimer</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our Service uses artificial intelligence to transform pet photos. You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>AI-generated results may vary and are not guaranteed to meet specific expectations</li>
                <li>The AI may occasionally produce unexpected or imperfect results</li>
                <li>PawStudio does not guarantee the accuracy, quality, or suitability of AI-generated content</li>
                <li>You are responsible for reviewing generated content before use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                The Service, including its original content, features, functionality, design, and AI technology, is owned by PawStudio and protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Our trademarks may not be used without our prior written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Breach of these Terms</li>
                <li>Violation of applicable laws</li>
                <li>Fraudulent or abusive behavior</li>
                <li>At our sole discretion for any other reason</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Upon termination, your right to use the Service will cease immediately. Unused credits are forfeited upon account termination for cause.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-gray-600 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE. PAWSTUDIO DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PAWSTUDIO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE. IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO PAWSTUDIO IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM, OR $100, WHICHEVER IS GREATER.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree to defend, indemnify, and hold harmless PawStudio, its officers, directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs, or debt arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party right, including intellectual property rights; or (d) any content you upload to the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law and Disputes</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the Republic of Estonia and the European Union, without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Any disputes arising from these Terms or the Service shall be resolved in the courts of Estonia. For EU consumers, you may also have the right to bring proceedings in your country of residence.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>Email:</strong> support@paw-studio.com<br />
                <strong>Website:</strong> <a href="https://paw-studio.com" className="text-orange-600 hover:text-orange-700">paw-studio.com</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <Link href="/privacy" className="text-orange-600 hover:text-orange-700">
                Privacy Policy
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
