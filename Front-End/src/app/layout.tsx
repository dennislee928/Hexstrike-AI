import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/responsive.css'
import '../styles/animations.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppLayout } from '@/components/layout/AppLayout'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'HexStrike AI - Advanced Cybersecurity Platform',
  description: 'AI-powered cybersecurity automation platform with 150+ security tools and AI agents for penetration testing, bug bounty hunting, and CTF competitions.',
  keywords: 'cybersecurity, penetration testing, AI, security tools, vulnerability assessment, bug bounty, CTF, ethical hacking, security automation',
  authors: [{ name: 'HexStrike AI Team' }],
  creator: 'HexStrike AI',
  publisher: 'HexStrike AI',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  colorScheme: 'dark light',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#00ff41' }
    ]
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hexstrike.ai',
    siteName: 'HexStrike AI',
    title: 'HexStrike AI - Advanced Cybersecurity Platform',
    description: 'AI-powered cybersecurity automation platform with 150+ security tools and AI agents for penetration testing, bug bounty hunting, and CTF competitions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HexStrike AI - Advanced Cybersecurity Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HexStrike AI - Advanced Cybersecurity Platform',
    description: 'AI-powered cybersecurity automation platform with 150+ security tools',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={inter.variable}
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </head>
      <body 
        className={`${inter.className} antialiased`} 
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider>
            <Providers>
              <AppLayout>
                {children}
              </AppLayout>
            </Providers>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
