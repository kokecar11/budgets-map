import { auth } from "@/auth"
import { accountApi } from "@/features/accounts/api"
import { AccountList } from "@/features/accounts/account-list"

export default async function AccountsPage() {
  const session = await auth()
  let accounts: Awaited<ReturnType<typeof accountApi.list>> = []
  try {
    accounts = await accountApi.list(session?.accessToken ?? "")
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  return (
    <div className="p-6">
      <AccountList initialAccounts={accounts} />
    </div>
  )
}
