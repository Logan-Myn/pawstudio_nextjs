import Link from 'next/link'

export const metadata = {
  title: 'Support | PawStudio',
  description: 'Get help with PawStudio - FAQ, contact information, and support resources for our AI pet photo app.',
}

const faqs = [
  {
    question: 'How does PawStudio work?',
    answer: 'PawStudio uses advanced AI technology to transform your pet photos into professional studio-quality images. Simply upload a photo of your pet, choose a scene or style, and our AI will generate a stunning transformation in seconds.'
  },
  {
    question: 'What types of pets are supported?',
    answer: 'PawStudio works best with dogs and cats, but our AI can also handle other pets like rabbits, birds, and small animals. For best results, use a clear photo where your pet is the main subject.'
  },
  {
    question: 'How do credits work?',
    answer: 'Each photo transformation uses 1 credit. Your first transformation is free when you sign up. After that, you can purchase credit packs: Starter (5 credits for $2.99), Premium (20 credits for $9.99), or Ultimate (50 credits for $19.99). Credits never expire.'
  },
  {
    question: 'What photo formats are supported?',
    answer: 'We support all common image formats including JPG, PNG, HEIC (from iPhone), and WebP. For best results, use a high-quality photo with good lighting where your pet is clearly visible.'
  },
  {
    question: 'Can I use the transformed photos commercially?',
    answer: 'Yes! You own the rights to your transformed images and can use them for personal or commercial purposes, including social media, prints, merchandise, and more.'
  },
  {
    question: 'How long does a transformation take?',
    answer: 'Most transformations complete in 15-30 seconds. Processing time may vary slightly depending on the complexity of the scene and current server load.'
  },
  {
    question: 'What if I\'m not happy with a result?',
    answer: 'AI results can vary. If you\'re not satisfied with a transformation, you can try again with the same or a different scene. We recommend using clear, well-lit photos for the best results. Each attempt uses 1 credit.'
  },
  {
    question: 'How do I delete my account?',
    answer: 'You can request account deletion by contacting us at support@paw-studio.com. We will process your request and delete all your personal data within 30 days, as outlined in our Privacy Policy.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we take data security seriously. Your photos are processed securely and stored with encryption. We never share your personal information with third parties for marketing purposes. See our Privacy Policy for full details.'
  },
]

export default function SupportPage() {
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help?</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        {/* Contact Card */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 mb-12 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Need help?</h2>
              <p className="text-orange-100">Our team is here to assist you with any questions or issues.</p>
            </div>
            <a
              href="mailto:support@paw-studio.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@paw-studio.com
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is happy to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@paw-studio.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">We typically respond within 24 hours</p>
          </div>
        </div>

        {/* Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <Link href="/terms" className="text-orange-600 hover:text-orange-700">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-orange-600 hover:text-orange-700">
            Privacy Policy
          </Link>
          <Link href="/" className="text-orange-600 hover:text-orange-700">
            Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} PawStudio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
