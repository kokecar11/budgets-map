"use client"

import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { SearchSelect } from "@workspace/ui/components/search-select"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Switch } from "@workspace/ui/components/switch"
import { transactionApi } from "./api"
import type { Transaction, TransactionCreate, TransactionUpdate } from "./types"
import type { Account } from "@/features/accounts/types"
import type { Category } from "@/features/categories/types"
import type { SavingGoal } from "@/features/savings/types"
import type { Loan } from "@/features/loans/types"
import { loanPaymentApi } from "@/features/loans/api"
import { useTranslations } from "next-intl"
import { useCurrency } from "@/hooks/use-currency"

// TYPE_OPTIONS are built inside the component via useTranslations

function toTimeString(isoDate: string): string {
  const d = new Date(isoDate)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

interface TransactionFormProps {
  token: string
  accounts: Account[]
  categories: Category[]
  savingGoals: SavingGoal[]
  loans: Loan[]
  initialValues?: Transaction
  isPro?: boolean
  onSuccess: (transaction: Transaction) => void
  onCancel: () => void
}

export function TransactionForm({
  token,
  accounts,
  categories,
  savingGoals,
  loans,
  initialValues,
  isPro = false,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const t = useTranslations("transactions")
  const fmt = useCurrency()
  const isEditing = !!initialValues

  const TYPE_OPTIONS = [
    { value: "expense", label: t("typeExpense") },
    { value: "income", label: t("typeIncome") },
    { value: "transfer", label: t("typeTransfer") },
    { value: "saving", label: t("typeSaving") },
  ]

  const activeGoals = savingGoals.filter((g) => g.status === "active")
  const activeLoans = loans.filter((l) => l.status === "active")

  const nowDate = new Date()
  const defaultDate = nowDate.toISOString().split("T")[0]
  const defaultTime = `${String(nowDate.getHours()).padStart(2, "0")}:${String(nowDate.getMinutes()).padStart(2, "0")}`

  const form = useForm({
    defaultValues: isEditing
      ? {
          account_id: initialValues.account_id ?? "",
          type: initialValues.type,
          amount: String(initialValues.amount),
          date: initialValues.date.split("T")[0],
          time: toTimeString(initialValues.date),
          category_id: initialValues.category_id ?? "",
          description: initialValues.description ?? "",
          saving_goal_id: initialValues.saving_goal_id ?? "",
          transfer_to_account_id: initialValues.transfer_to_account_id ?? "",
          loan_id: "",
          interest_paid: "0",
          is_recurring: initialValues.is_recurring,
          recurrence: (initialValues.recurrence ?? "none") as
            | "none"
            | "weekly"
            | "monthly",
        }
      : {
          account_id: "",
          type: "expense" as TransactionCreate["type"],
          amount: "",
          date: defaultDate,
          time: defaultTime,
          category_id: "",
          description: "",
          saving_goal_id: "",
          transfer_to_account_id: "",
          loan_id: "",
          interest_paid: "0",
          is_recurring: false,
          recurrence: "none" as "none" | "weekly" | "monthly",
        },
    onSubmit: async ({ value }) => {
      try {
        const isoDate = new Date(
          `${value.date}T${value.time || "00:00"}:00`,
        ).toISOString()

        if (isEditing) {
          const payload: TransactionUpdate = {
            type: value.type,
            amount: Number(value.amount),
            date: isoDate,
            category_id: value.category_id || undefined,
            description: value.description || undefined,
          }
          const tx = await transactionApi.update(
            initialValues.id,
            payload,
            token,
          )
          toast.success(t("updated"))
          onSuccess(tx)
          return
        }

        // Expense linked to a loan → create loan payment first
        let loan_payment_id: string | undefined
        if (value.type === "expense" && value.loan_id) {
          const d = new Date(`${value.date}T${value.time || "00:00"}:00`)
          const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          const interestPaid = Math.max(0, Number(value.interest_paid) || 0)
          const principalPaid = Math.max(0, Number(value.amount) - interestPaid)
          const loanPayment = await loanPaymentApi.create(
            value.loan_id,
            {
              amount: Number(value.amount),
              principal_paid: principalPaid,
              interest_paid: interestPaid,
              date: isoDate,
              period,
            },
            token,
          )
          loan_payment_id = loanPayment.id
        }

        const payload: TransactionCreate = {
          account_id: value.account_id,
          type: value.type,
          amount: Number(value.amount),
          date: isoDate,
          category_id: value.category_id || undefined,
          description: value.description || undefined,
          saving_goal_id:
            value.type === "saving" && value.saving_goal_id
              ? value.saving_goal_id
              : undefined,
          transfer_to_account_id:
            value.type === "transfer" && value.transfer_to_account_id
              ? value.transfer_to_account_id
              : undefined,
          loan_payment_id,
          is_recurring: value.is_recurring,
          recurrence: value.is_recurring ? value.recurrence : "none",
        }

        const tx = await transactionApi.create(payload, token)
        toast.success(t("created"))
        onSuccess(tx)
      } catch (err) {
        if (err instanceof Error && err.message === "RECURRING_LIMIT_REACHED") {
          toast.error(
            t("recurringLimitReached"),
            {
              action: {
                label: t("seePlans"),
                onClick: () => {
                  window.location.href = "/pricing"
                },
              },
            },
          )
        } else {
          toast.error(
            err instanceof Error
              ? err.message
              : t("errorSaving"),
          )
        }
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        {/* Cuenta — solo en creación */}
        {!isEditing && (
          <form.Field
            name="account_id"
            validators={{
              onSubmit: ({ value }) =>
                !value ? t("accountRequired") : undefined,
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>{t("account")}</FieldLabel>
                <SearchSelect
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v)}
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: a.name,
                  }))}
                  placeholder={t("selectAccount")}
                  searchPlaceholder={t("searchAccount")}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>
        )}

        {/* Tipo + Monto */}
        <div className="grid grid-cols-2 gap-3">
          <form.Field name="type">
            {(field) => (
              <Field>
                <FieldLabel>{t("type")}</FieldLabel>
                <SearchSelect
                  value={field.state.value}
                  onValueChange={(v) =>
                    field.handleChange(v as TransactionCreate["type"])
                  }
                  options={TYPE_OPTIONS}
                  placeholder="Tipo"
                />
              </Field>
            )}
          </form.Field>

          <form.Field
            name="amount"
            validators={{
              onSubmit: ({ value }) =>
                !value || Number(value) <= 0 ? t("invalidAmount") : undefined,
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="amount">{t("amount")}</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </Field>
            )}
          </form.Field>
        </div>

        {/* Fecha + Hora */}
        <div className="grid grid-cols-2 gap-3">
          <form.Field name="date">
            {(field) => (
              <Field>
                <FieldLabel>{t("date")}</FieldLabel>
                <DatePicker
                  value={field.state.value ?? ""}
                  onChange={field.handleChange}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="time">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="time">{t("time")}</FieldLabel>
                <Input
                  id="time"
                  type="time"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
        </div>

        {/* Categoría */}
        <form.Field name="category_id">
          {(field) => (
            <Field>
              <FieldLabel>
                {t("category")}{" "}
                <span className="text-muted-foreground">({t("noCategory")})</span>
              </FieldLabel>
              <SearchSelect
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
                }))}
                placeholder={t("noCategory")}
                searchPlaceholder={t("searchCategory")}
              />
            </Field>
          )}
        </form.Field>

        {/* Descripción */}
        <form.Field name="description">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="description">
                {t("descriptionField")}{" "}
                <span className="text-muted-foreground">({t("noCategory")})</span>
              </FieldLabel>
              <Input
                id="description"
                placeholder={t("descriptionPlaceholder")}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        {/* Campos condicionales según tipo — solo en creación */}
        {!isEditing && (
          <form.Subscribe
            selector={(s) => ({
              type: s.values.type,
              loan_id: s.values.loan_id,
            })}
          >
            {({ type, loan_id }) => (
              <>
                {/* Ahorro → meta */}
                {type === "saving" && (
                  <form.Field name="saving_goal_id">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          {t("savingGoal")}{" "}
                          <span className="text-muted-foreground">
                            ({t("noSpecificGoal")})
                          </span>
                        </FieldLabel>
                        {activeGoals.length === 0 ? (
                          <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
                            {t("noActiveGoals")}{" "}
                            <a
                              href="/savings"
                              className="underline underline-offset-2 hover:text-foreground"
                            >
                              {t("createInSavings")}
                            </a>{" "}
                            {t("toLink")}
                          </p>
                        ) : (
                          <SearchSelect
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v)}
                            options={activeGoals.map((g) => ({
                              value: g.id,
                              label: g.name,
                            }))}
                            placeholder={t("noSpecificGoal")}
                            searchPlaceholder={t("searchGoal")}
                          />
                        )}
                      </Field>
                    )}
                  </form.Field>
                )}

                {/* Transferencia → cuenta destino */}
                {type === "transfer" && (
                  <form.Field
                    name="transfer_to_account_id"
                    validators={{
                      onSubmit: ({ value }) =>
                        !value ? t("destinationRequired") : undefined,
                    }}
                  >
                    {(field) => (
                      <Field>
                        <FieldLabel>{t("destinationAccount")}</FieldLabel>
                        <SearchSelect
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v)}
                          options={accounts.map((a) => ({
                            value: a.id,
                            label: a.name,
                          }))}
                          placeholder={t("selectDestination")}
                          searchPlaceholder={t("searchAccountDest")}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-destructive text-sm">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                      </Field>
                    )}
                  </form.Field>
                )}

                {/* Gasto → préstamo */}
                {type === "expense" && activeLoans.length > 0 && (
                  <form.Field name="loan_id">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          {t("loanPayment")}{" "}
                          <span className="text-muted-foreground">
                            ({t("noLoanLink")})
                          </span>
                        </FieldLabel>
                        <SearchSelect
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v)}
                          options={activeLoans.map((l) => ({
                            value: l.id,
                            label: `${l.name} — ${l.lender}`,
                          }))}
                          placeholder={t("noLoanLink")}
                          searchPlaceholder={t("searchLoan")}
                        />
                      </Field>
                    )}
                  </form.Field>
                )}

                {/* Préstamo → interés */}
                {type === "expense" && loan_id && (
                  <form.Field name="interest_paid">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="interest_paid">
                          {t("loanInterest")}{" "}
                          <span className="text-muted-foreground">
                            ({t("noLoanLink")})
                          </span>
                        </FieldLabel>
                        <Input
                          id="interest_paid"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <form.Subscribe
                          selector={(s) => ({
                            amount: s.values.amount,
                            interest: s.values.interest_paid,
                          })}
                        >
                          {({ amount, interest }) => {
                            const principal = Number(amount) - Number(interest)
                            if (Number(interest) > 0 && principal >= 0) {
                              return (
                                <div className="rounded-lg bg-muted/50 border p-2.5 text-xs flex flex-col gap-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      {t("capitalLabel")}
                                    </span>
                                    <span className="font-medium">
                                      {fmt(principal)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      {t("interestLabel")}
                                    </span>
                                    <span className="font-medium text-red-600">
                                      {fmt(Number(interest))}
                                    </span>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        </form.Subscribe>
                      </Field>
                    )}
                  </form.Field>
                )}
              </>
            )}
          </form.Subscribe>
        )}

        {/* Recurring — solo en creación */}
        {!isEditing && (
          <>
            <form.Field name="is_recurring">
              {(field) => (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{t("recurringTransaction")}</p>
                    {!isPro && (
                      <p className="text-xs text-muted-foreground">{t("freePlanLimit")}</p>
                    )}
                  </div>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v)}
                  />
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.values.is_recurring}>
              {(is_recurring) =>
                is_recurring ? (
                  <form.Field name="recurrence">
                    {(field) => (
                      <Field>
                        <FieldLabel>{t("frequency")}</FieldLabel>
                        <SearchSelect
                          value={field.state.value}
                          onValueChange={(v) =>
                            field.handleChange(
                              v as "none" | "weekly" | "monthly",
                            )
                          }
                          options={[
                            { value: "weekly", label: t("weekly") },
                            { value: "monthly", label: t("monthly") },
                          ]}
                          placeholder={t("selectFrequency")}
                        />
                      </Field>
                    )}
                  </form.Field>
                ) : null
              }
            </form.Subscribe>
          </>
        )}

        {isEditing && initialValues?.is_recurring && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t("stopRecurrenceTitle")}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">{t("stopRecurrenceDesc")}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
              onClick={async () => {
                try {
                  const tx = await transactionApi.update(
                    initialValues.id,
                    { is_recurring: false, recurrence: "none" },
                    token
                  )
                  toast.success(t("recurrenceStopped"))
                  onSuccess(tx)
                } catch {
                  toast.error(t("errorSaving"))
                }
              }}
            >
              {t("stopRecurrence")}
            </Button>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? t("saving")
                    : t("creating")
                  : isEditing
                    ? t("saveChanges")
                    : t("create")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </FieldGroup>
    </form>
  )
}
