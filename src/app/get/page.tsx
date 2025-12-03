'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const APP_STORE_URL = 'https://apps.apple.com/app/pawstudio/id6746587498'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.pawstudio.app'

type Platform = 'ios' | 'android' | 'desktop' | 'unknown'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown'

  const userAgent = navigator.userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios'
  }

  if (/android/.test(userAgent)) {
    return 'android'
  }

  return 'desktop'
}

export default function GetAppPage() {
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const detected = detectPlatform()
    setPlatform(detected)

    if (detected === 'ios') {
      setRedirecting(true)
      window.location.href = APP_STORE_URL
    } else if (detected === 'android') {
      setRedirecting(true)
      window.location.href = PLAY_STORE_URL
    }
  }, [])

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Redirecting to the app store...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <span className="text-6xl">🐾</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">PawStudio</h1>
        <p className="text-gray-600 mb-8">
          Transform your pet photos into professional portraits
        </p>

        <div className="space-y-4">
          <a
            href={APP_STORE_URL}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span>Download on the App Store</span>
          </a>

          <a
            href={PLAY_STORE_URL}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
            <span>Get it on Google Play</span>
          </a>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4">Or scan the QR code with your phone</p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                <Image
                  src="/qr-ios.png"
                  alt="iOS QR Code"
                  width={88}
                  height={88}
                  className="rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-400">iOS QR</span>'
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">iOS</span>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                <Image
                  src="/qr-android.png"
                  alt="Android QR Code"
                  width={88}
                  height={88}
                  className="rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-400">Android QR</span>'
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">Android</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Your first photo transformation is free!
        </p>
      </div>
    </div>
  )
}
