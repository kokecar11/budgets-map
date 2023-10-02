'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

export default function Home () {
  const [email, setEmail] = useState('')
  return (
    <main className='flex flex-col mx-auto max-w-screen-xl w-full justify-center items-center text-center z-10 px-4'>
      <h1 className='text-4xl sm:text-7xl font-extrabold mt-3 mb-5 text-primary'>
        Master your finances <br />&{' '}
        <span className='bg-gradient-to-r from-sky-500 via-emerald-500 to-sky-500 bg-clip-text text-transparent animate-hero-title'>
          Design your own destiny
        </span>{' '}
      </h1>
      <h2 className='max-w-xl text-zinc-500 dark:text-zinc-300'>
        Unlock the potential of your financial future with our powerful
        financial management tools. Take control, set your course, and shape
        your own path to success.
      </h2>
      <div className='flex w-full max-w-lg items-center space-x-2 my-2'>
        <Input
          className='w-full'
          type='email'
          placeholder='Enter your email'
          value={email}
          onChange={(e) => {
            setEmail(e.currentTarget.value)
          }}
        />
        <Button asChild variant={'secondary'}>
          <Link
            className='w-48'
            href={`https://magic.beehiiv.com/v1/8432e1f7-e24c-4571-9a87-bd4188ef0949?email=${email}&redirect_to=http://localhost:3000`}
          >
            Join the waitlist
          </Link>
        </Button>
      </div>
    </main>
  )
}
