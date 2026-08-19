import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, ORDER_STATUSES } from "@/components/common/StatusBadge";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { apiErrorMessage } from "@/api/client";
import { cn } from "@/components/ui/utils";
import type { Order, OrderStatus } from "@/types/api";

export function AdminOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | "All">("All");
  const { data, isLoading } = useAdminOrders({ status: filter === "All" ? undefined : filter, limit: 50 });
  const updateStatus = useUpdateOrderStatus();
  const [selected, setSelected] = useState<Order | null>(null);

  const changeStatus = (id: string, status: OrderStatus) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: (updated) => {
          toast.success(`Status updated to ${status}`);
          setSelected(updated);
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Не вдалося оновити статус")),
      },
    );
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} orders total</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {(["All", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Order</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Замовлень не знайдено
                  </td>
                </tr>
              ) : (
                data?.items.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-mono font-medium text-foreground">{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{order.user?.name ?? order.shippingName}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.email ?? order.shippingEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground text-right font-mono">${Number(order.totalAmount).toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => setSelected(order)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {selected?.id.slice(0, 8) ?? ""}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">{selected.user?.name ?? selected.shippingName}</p>
                  <p className="text-sm text-muted-foreground">{selected.user?.email ?? selected.shippingEmail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                {selected.items.map((item) => (
                  <div key={item.id} className="flex justify-between px-4 py-3 text-sm border-b border-border last:border-0">
                    <span className="text-muted-foreground">{item.productName} ×{item.qty}</span>
                    <span className="font-mono font-medium">${(Number(item.unitPrice) * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 text-sm font-semibold bg-muted/40">
                  <span>Total</span>
                  <span className="font-mono">${Number(selected.totalAmount).toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Update status</label>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(selected.id, s)}
                      disabled={updateStatus.isPending}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                        selected.status === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
