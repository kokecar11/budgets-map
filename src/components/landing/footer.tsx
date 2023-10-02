import Link from 'next/link'

export function Footer () {
  return (
    <footer className='flex flex-col mx-auto w-full justify-center items-center text-center z-10 px-4 border-input border-t border-opacity-10'>
        <span className=''>Made with ❤️ <Link href='https://twitter.com/Kokecar11' className='underline'>@Kokecar11</Link></span>
    </footer>
  )
}
