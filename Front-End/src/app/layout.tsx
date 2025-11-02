import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/responsive.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { MobileNav } from '@/components/navigation/MobileNav'
import { GlobalKeyboardShortcuts } from '@/components/GlobalKeyboardShortcuts'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HexStrike AI - Advanced Cybersecurity Platform',
  description: 'AI-powered cybersecurity automation platform with 150+ security tools',
  keywords: 'cybersecurity, penetration testing, AI, security tools, vulnerability assessment, bug bounty, CTF',
  authors: [{ name: 'HexStrike AI Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    title: 'HexStrike AI - Advanced Cybersecurity Platform',
    description: 'AI-powered cybersecurity automation platform with 150+ security tools',
    type: 'website',
    locale: 'en_US'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} cyber-bg min-h-screen`} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider>
            <Providers>
              <GlobalKeyboardShortcuts />
              <div className="relative min-h-screen">
                {/* Scan line effect */}
                <div className="scan-line opacity-30"></div>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 overflow-auto pb-16 md:pb-0">
                      {children}
                    </main>
                  </div>
                </div>
                <MobileNav />
              </div>
            </Providers>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
