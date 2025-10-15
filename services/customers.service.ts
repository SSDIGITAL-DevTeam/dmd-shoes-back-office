// services/customers.service.ts
import { apiGet, apiSend } from "@/lib/api/client";
import type { ItemBase, ListResponse } from "@/types";

export type CustomerItem = ItemBase & {
  name: string;
  email?: string;
  phone?: string;
};

export async function listCustomers(params?: { page?: number; perPage?: number; search?: string }) {
  return apiGet<ListResponse<CustomerItem>>("/api/customers", {
    page: params?.page ?? 1,
    perPage: params?.perPage ?? 10,
    search: params?.search ?? "",
  });
}

export async function getCustomer(id: string | number) {
  return apiGet<CustomerItem>(`/api/customers/${id}`);
}

export async function createCustomer(payload: Partial<CustomerItem>) {
  return apiSend<CustomerItem>("/api/customers", "POST", payload);
}

export async function updateCustomer(id: string | number, payload: Partial<CustomerItem>) {
  return apiSend<CustomerItem>(`/api/customers/${id}`, "PUT", payload);
}

export async function deleteCustomer(id: string | number) {
  return apiSend<{ status: string; message?: string }>(`/api/customers/${id}`, "DELETE");
}