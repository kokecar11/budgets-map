"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, Pencil, Tag, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { useTranslations } from "next-intl"
import { CategoryForm } from "./category-form"
import { categoryApi } from "./api"
import type { Category } from "./types"

interface CategoryListProps {
  initialCategories: Category[]
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const { data: session } = useSession()
  const t = useTranslations("categories")
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [openForm, setOpenForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  function handleCreated(category: Category) {
    setCategories((prev) => [category, ...prev])
    setOpenForm(false)
  }

  function handleUpdated(category: Category) {
    setCategories((prev) => prev.map((c) => c.id === category.id ? category : c))
    setEditingCategory(null)
  }

  async function handleDelete(id: string) {
    try {
      await categoryApi.delete(id, session?.accessToken ?? "")
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success(t("categoryDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorDeleting"))
    }
  }

  const income = categories.filter((c) => c.type === "income")
  const expense = categories.filter((c) => c.type === "expense")

  return (
    <div className="flex flex-col gap-6">

      {/* Header section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Title + button */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
              <Tag className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="size-4" />
            {t("newCategory")}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">{t("totalCategories")}</p>
            <p className="text-3xl font-bold">{categories.length}</p>
          </div>
          <div className="px-6 py-5 bg-green-500/5 border-x">
            <p className="text-xs font-semibold tracking-widest text-green-600 dark:text-green-500 uppercase mb-2">{t("incomeCategories")}</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">{income.length}</p>
          </div>
          <div className="px-6 py-5 bg-red-500/5">
            <p className="text-xs font-semibold tracking-widest text-red-600 dark:text-red-500 uppercase mb-2">{t("expenseCategories")}</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">{expense.length}</p>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {t("noCategories")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Income group */}
          {income.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-4 border-b">
                <div className="flex items-center justify-center size-10 rounded-lg bg-green-500/10 shrink-0">
                  <ArrowUpCircle className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">{t("income")}</p>
                  <p className="text-xs text-muted-foreground">{t("countCategories", { count: income.length })}</p>
                </div>
              </div>
              <div className="divide-y">
                {income.map((c) => (
                  <CategoryRow key={c.id} category={c} onDelete={handleDelete} onEdit={setEditingCategory} />
                ))}
              </div>
            </div>
          )}

          {/* Expense group */}
          {expense.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-4 border-b">
                <div className="flex items-center justify-center size-10 rounded-lg bg-red-500/10 shrink-0">
                  <ArrowDownCircle className="size-5 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold">{t("expense")}</p>
                  <p className="text-xs text-muted-foreground">{t("countCategories", { count: expense.length })}</p>
                </div>
              </div>
              <div className="divide-y">
                {expense.map((c) => (
                  <CategoryRow key={c.id} category={c} onDelete={handleDelete} onEdit={setEditingCategory} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleNew")}</DialogTitle>
            <DialogDescription>{t("dialogDescNew")}</DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSuccess={handleCreated}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={(open) => { if (!open) setEditingCategory(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleEdit")}</DialogTitle>
            <DialogDescription>{t("dialogDescEdit")}</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              initialValues={editingCategory}
              onSuccess={handleUpdated}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryRow({ category, onDelete, onEdit }: { category: Category; onDelete: (id: string) => void; onEdit: (c: Category) => void }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
      <div
        className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${category.color ? "bg-(--cat-bg)" : "bg-muted"}`}
        style={category.color ? { "--cat-bg": `${category.color}20` } as React.CSSProperties : undefined}
      >
        {category.icon
          ? <span className="text-lg leading-none">{category.icon}</span>
          : <Tag className="size-5 text-muted-foreground" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{category.name}</p>
        {category.color && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="size-2.5 rounded-full inline-block bg-(--cat-dot)" style={{ "--cat-dot": category.color } as React.CSSProperties} />
            <span className="text-xs text-muted-foreground font-mono">{category.color}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(category)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(category.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
