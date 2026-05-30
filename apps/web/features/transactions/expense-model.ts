import type { Transaction } from "./types"
import type { ExpenseModel } from "@/features/financial-rules/types"

/**
 * Decides whether a transaction counts as an "expense" under the user's
 * accounting model.
 *
 * - cash: the cash leaving the bank is the expense → type === "expense"
 *   (includes credit-card payments; excludes the card charge itself).
 * - accrual: the purchase is the expense when charged → real bank expenses
 *   (excluding card payments, which are debt settlement) plus credit-card
 *   charges.
 */
export function isExpenseForModel(tx: Transaction, model: ExpenseModel): boolean {
  if (model === "cash") {
    return tx.type === "expense"
  }
  return (
    (tx.type === "expense" && !tx.credit_card_payment_id) ||
    tx.type === "credit_card_charge"
  )
}
