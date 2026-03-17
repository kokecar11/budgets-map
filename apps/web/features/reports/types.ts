export interface MonthlyStat {
  month: number
  income: number
  expenses: number
  net: number
}

export interface MonthlyStatsResponse {
  year: number
  stats: MonthlyStat[]
}

export interface CategoryStat {
  category_id: string | null
  total: number
  count: number
}

export interface CategoryStatsResponse {
  stats: CategoryStat[]
}
