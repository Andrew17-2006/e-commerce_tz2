import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, DollarSign, Download, Layers, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsSummary, useSalesByDay, useTopProducts } from "@/hooks/useAnalytics";
import { apiClient } from "@/api/client";

const todayKey = new Date().toISOString().slice(0, 10);

export function AdminDashboardPage() {
  const [days, setDays] = useState(30);
  const { data: summary } = useAnalyticsSummary();
  const { data: sales, isLoading: salesLoading } = useSalesByDay(days);
  const { data: topProducts, isLoading: topLoading } = useTopProducts(5);

  const stats = [
    { label: "Total Revenue", value: `$${(summary?.totalRevenue ?? 0).toLocaleString()}`, icon: <DollarSign size={20} /> },
    { label: "Orders", value: `${summary?.orderCount ?? 0}`, icon: <ShoppingBag size={20} /> },
    {
      label: "Units Sold (top 5)",
      value: `${topProducts?.reduce((s, p) => s + p.sold, 0) ?? 0}`,
      icon: <BarChart2 size={20} />,
    },
    { label: "Tracked Products", value: `${topProducts?.length ?? 0}`, icon: <Layers size={20} /> },
  ];

  const handleExport = async () => {
    try {
      const res = await apiClient.get("/analytics/export.csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Не вдалося експортувати звіт");
    }
  };

  return (
    <div className="p-6 max-w-5xl w-full">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sales overview</p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                days === d ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="w-10 h-10 bg-primary/8 text-primary rounded-xl flex items-center justify-center mb-3">{s.icon}</div>
            <p className="text-2xl font-semibold text-foreground font-mono leading-none mb-1">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-foreground">Revenue trend</h2>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
        {salesLoading ? (
          <Skeleton className="h-55 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sales ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5046E5" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#5046E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8C8784" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#8C8784" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid rgba(24,23,26,0.08)", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#5046E5" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              <ReferenceLine
                x={todayKey}
                stroke="#5046E5"
                strokeDasharray="4 4"
                label={{ value: "Today", position: "insideTop", fontSize: 11, fill: "#5046E5" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Top 5 products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40">
                {["#", "Product", "Units sold", "Revenue"].map((h, i) => (
                  <th
                    key={h}
                    className={`text-xs font-medium text-muted-foreground py-3 ${i === 0 ? "px-6 text-left" : i === 3 ? "px-6 text-right" : "px-4 text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ) : (
                topProducts?.map((p, i) => (
                  <tr key={p.productId} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right font-mono">{p.sold}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-foreground text-right font-mono">${p.revenue.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
