import { http } from "./http";

export type DashboardSummary = {
  products?: { total?: number; active?: number; inactive?: number };
  articles?: { total?: number; publish?: number; draft?: number };
  categories?: { total?: number };
  customers?: { total?: number };
};
export type DashboardCustomer = { id: number; full_name: string; email: string; whatsapp_number: string | null };
export type DashboardResponse = {
  status?: string;
  message?: string;
  data?: DashboardSummary;
  customers?: { items: DashboardCustomer[]; meta: { current_page: number; per_page: number; total: number; last_page: number } };
};

export async function getDashboard(params?: { customers_search?: string; customers_per_page?: number; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.customers_search) qs.set("customers_search", params.customers_search);
  if (params?.customers_per_page) qs.set("customers_per_page", String(params.customers_per_page));
  if (params?.page) qs.set("page", String(params.page));
  const url = qs.toString() ? `/api/dashboard?${qs.toString()}` : `/api/dashboard`;
  return http<DashboardResponse>(url);
}