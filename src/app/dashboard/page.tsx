import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export default async function Home () {
  const supabase = createServerComponentClient({ cookies })
  const { data: budgets } = await supabase.from('budgets').select()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
      <h1>Budgets-map</h1>
        <pre>
          {
            JSON.stringify(budgets, null, 2)
          }
        </pre>
      </div>
    </main>
  )
}
