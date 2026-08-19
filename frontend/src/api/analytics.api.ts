import { apiClient } from "./client";
import type { AnalyticsSummary, SalesByDay, TopProduct } from "@/types/api";

export const analyticsApi = {
  summary: () => apiClient.get<AnalyticsSummary>("/analytics/summary").then((r) => r.data),
  topProducts: (limit = 5) =>
    apiClient.get<TopProduct[]>("/analytics/top-products", { params: { limit } }).then((r) => r.data),
  salesByDay: (days = 30) =>
    apiClient.get<SalesByDay[]>("/analytics/sales-by-day", { params: { days } }).then((r) => r.data),
  exportCsvUrl: () => `${apiClient.defaults.baseURL}/analytics/export.csv`,
};
