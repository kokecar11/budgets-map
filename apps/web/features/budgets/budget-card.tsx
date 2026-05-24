"use client"

import Link from "next/link"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { ChevronRight, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Budget } from "./types"

interface BudgetCardProps {
  budget: Budget
  onDelete: (id: string) => void
}

export function BudgetCard({ budget, onDelete }: BudgetCardProps) {
  const t = useTranslations("budgets")
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <Link href={`/budgets/${budget.id}`} className="flex flex-1 items-center gap-2 min-w-0">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-medium">{budget.name}</span>
            <span className="text-muted-foreground text-sm">
              {t(`months.${budget.month}`)} {budget.year}
            </span>
            {budget.description && (
              <span className="text-muted-foreground text-xs truncate">{budget.description}</span>
            )}
          </div>
          <ChevronRight className="size-4 text-muted-foreground ml-auto shrink-0" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive shrink-0 ml-2"
          onClick={() => onDelete(budget.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
