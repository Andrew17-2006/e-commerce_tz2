import { CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { OrderStatus } from "@/types/api";

const STATUS_CFG: Record<OrderStatus, { color: string; icon: React.ReactNode; label: string }> = {
  NEW: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock size={11} />, label: "New" },
  PROCESSING: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Package size={11} />,
    label: "Processing",
  },
  SHIPPED: {
    color: "bg-violet-50 text-violet-700 border-violet-200",
    icon: <Truck size={11} />,
    label: "Shipped",
  },
  COMPLETED: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle size={11} />,
    label: "Completed",
  },
  CANCELLED: {
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle size={11} />,
    label: "Cancelled",
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
        cfg.color,
      )}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

export const ORDER_STATUSES: OrderStatus[] = ["NEW", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
