import { Link, NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2, LogOut, Package, ShoppingBag, Tag } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useAuthStore } from "@/stores/auth.store";

const ITEMS = [
  { to: "/admin", label: "Dashboard", icon: <BarChart2 size={18} />, end: true },
  { to: "/admin/products", label: "Products", icon: <ShoppingBag size={18} /> },
  { to: "/admin/categories", label: "Categories", icon: <Tag size={18} /> },
  { to: "/admin/orders", label: "Orders", icon: <Package size={18} /> },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link to="/" className="font-display text-lg font-semibold text-foreground tracking-tight hover:opacity-80 transition-opacity">
          mini<span className="text-primary">shop</span>
        </Link>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide">
          Admin
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <ArrowLeft size={18} /> Back to catalog
        </Link>
        <button
          onClick={() => {
            clearAuth();
            navigate("/");
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <LogOut size={18} /> Exit admin
        </button>
      </div>
    </aside>
  );
}
