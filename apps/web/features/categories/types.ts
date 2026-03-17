export interface Category {
  id: string
  user_id: string
  name: string
  type: "income" | "expense"
  icon?: string | null
  color?: string | null
  created_at?: string
  updated_at?: string
}

export interface CategoryCreate {
  name: string
  type: "income" | "expense"
  icon?: string
  color?: string
}

export interface CategoryUpdate {
  name?: string
  type?: "income" | "expense"
  icon?: string
  color?: string
}
