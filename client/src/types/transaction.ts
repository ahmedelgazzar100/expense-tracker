export interface CreateTransactionData {
  date: string;
  type: "in" | "out";
  amount: string;
  currency: "EGP" | "USD";
  category: string;
  description?: string;
  payment_method?: "cash" | "visa";
  notes?: string;
}

export interface TransactionData extends CreateTransactionData {
  id: number;
}

export interface TransactionFilters {
  date?: string;
  type?: "in" | "out" | "";
  currency?: "EGP" | "USD" | "";
  payment_method?: "cash" | "visa" | "";
}

export type GetItemsResponse = {
  transactions: TransactionData[];
  currentPage: number;
  totalPages: number;
};
