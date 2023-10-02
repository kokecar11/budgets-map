'use client'
import Image from 'next/image'
import { ModeToggle } from '../mode-toggle'
import Link from 'next/link'
// import { Button } from '../ui/button'
// import { signIn, signOut, useSession } from 'next-auth/react'

export function Navbar () {
  // const { data: session } = useSession()
  return (
    <header className='w-full flex z-10 px-4 items-center justify-between'>
      <Link href='/' className='flex items-center'>
        <Image
          src='/budgets-map-logo.svg'
          alt='Budgets-map logo'
          width={40}
          height={40}
        />
        <span className='ml-2 text-primary font-semibold'>Budgets Map</span>
      </Link>
      <div className='flex justify-between space-x-2'>
        <ModeToggle />
        {/* {session?.user ? (
          <Button
            onClick={async () => {
              await signOut()
            }}
          >
            Logout
          </Button>
        ) : (
          <Button
            onClick={async () => {
              await signIn('google')
            }}
          >
            Get Started
          </Button>
        )} */}
      </div>
    </header>
  )
}
