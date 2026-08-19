import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics.api";

export function useAnalyticsSummary() {
  return useQuery({ queryKey: ["analytics", "summary"], queryFn: analyticsApi.summary });
}

export function useTopProducts(limit = 5) {
  return useQuery({
    queryKey: ["analytics", "top-products", limit],
    queryFn: () => analyticsApi.topProducts(limit),
  });
}

export function useSalesByDay(days = 30) {
  return useQuery({
    queryKey: ["analytics", "sales-by-day", days],
    queryFn: () => analyticsApi.salesByDay(days),
  });
}
