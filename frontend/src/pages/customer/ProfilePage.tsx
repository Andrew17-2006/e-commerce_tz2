import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useMyOrders } from "@/hooks/useOrders";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/useAuth";
import type { Order } from "@/types/api";

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useMyOrders();
  const logout = useLogout();
  const [selected, setSelected] = useState<Order | null>(null);

  if (!user) return null;

  if (selected) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Back to orders
        </button>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-semibold text-foreground text-lg font-mono">{selected.id.slice(0, 8)}</h2>
              <p className="text-sm text-muted-foreground">{new Date(selected.createdAt).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <div className="space-y-2 mb-6">
            {selected.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground">{item.productName} ×{item.qty}</span>
                <span className="font-mono font-medium">${(Number(item.unitPrice) * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-semibold text-foreground">
            <span>Total</span>
            <span className="font-mono">${Number(selected.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-xl font-bold font-display">
          {user.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
        >
          <LogOut size={16} /> Sign out
        </Button>
      </div>

      <h2 className="font-semibold text-foreground mb-4">Order history</h2>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelected(order)}
              className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-foreground/20 transition-all text-left group"
            >
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                <Package size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium font-mono text-foreground">{order.id.slice(0, 8)}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold font-mono">${Number(order.totalAmount).toFixed(0)}</p>
                <ChevronRight size={14} className="text-muted-foreground ml-auto mt-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
