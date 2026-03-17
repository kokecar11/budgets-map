export interface Account {
  id: string
  user_id: string
  name: string
  type: "bank" | "cash" | "digital_wallet"
  balance: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface AccountCreate {
  name: string
  type: "bank" | "cash" | "digital_wallet"
  balance: number
  is_active?: boolean
}

export interface AccountUpdate {
  name?: string
  type?: "bank" | "cash" | "digital_wallet"
  balance?: number
  is_active?: boolean
}
