import { auth } from "@/auth"
import { categoryApi } from "@/features/categories/api"
import { CategoryList } from "@/features/categories/category-list"

export default async function CategoriesPage() {
  const session = await auth()
  let categories: Awaited<ReturnType<typeof categoryApi.list>> = []
  try {
    categories = await categoryApi.list(session?.accessToken ?? "")
  } catch {
    // Token expirado o inválido — mostrar lista vacía
  }

  return (
    <div className="p-6">
      <CategoryList initialCategories={categories} />
    </div>
  )
}
