import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Footer } from '~/components/landing/footer'
import { Navbar } from '~/components/landing/navbar'
import { ThemeProvider } from '~/components/themes-provider'
import { Providers } from './Providers'
// import Navbar from '~/components/navbar/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Budgets Map',
  description: 'Generated by create next app'
}

export default function RootLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange>
          <Providers>
            <div className='w-full h-screen grid grid-rows-[5rem_auto_5rem] grid-cols-1'>
              <Navbar />
              {children}
              <Footer />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
