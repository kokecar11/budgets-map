import { auth } from "@/auth"
import { reportsApi } from "@/features/reports/api"
import { categoryApi } from "@/features/categories/api"
import { ReportsContent } from "@/features/reports/reports-content"

export default async function ReportsPage() {
  const session = await auth()
  const token = session?.accessToken ?? ""
  const currentYear = new Date().getFullYear()

  const [monthlyStats, categoryStats, categories] = await Promise.allSettled([
    reportsApi.monthlyStats(token, currentYear),
    reportsApi.categoryStats(token, currentYear),
    categoryApi.list(token),
  ])

  return (
    <ReportsContent
      token={token}
      isPro={session?.user?.plan === "pro"}
      initialYear={currentYear}
      initialMonthlyStats={monthlyStats.status === "fulfilled" ? monthlyStats.value.stats : []}
      initialCategoryStats={categoryStats.status === "fulfilled" ? categoryStats.value.stats : []}
      categories={categories.status === "fulfilled" ? categories.value : []}
    />
  )
}
