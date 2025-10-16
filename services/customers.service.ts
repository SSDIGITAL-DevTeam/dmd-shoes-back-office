// services/customers.service.ts
import { apiGet } from "@/lib/api/client";

export type Customer = {
  id: number;
  full_name: string;
  email: string;
  whatsapp_number: string;
};

export type CustomersResponse = {
  status: string;
  message?: string;
  data: Customer[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export async function listCustomers(params: {
  page?: number;
  perPage?: number;
  search?: string;
}) {
  // NOTE: perPage (camelCase) → route Next akan memetakan ke per_page untuk backend
  return apiGet<CustomersResponse>("/api/customers", {
    page: params.page ?? 1,
    perPage: params.perPage ?? 10,
    search: params.search ?? "",
  });
}