import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useCart } from "@/hooks/useCart";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function CustomerHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const isFirstRun = useRef(true);
  const user = useAuthStore((s) => s.user);
  const { data: cart } = useCart();
  const cartCount = cart?.reduce((sum, item) => sum + item.qty, 0) ?? 0;

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    navigate(debouncedQ ? `/?search=${encodeURIComponent(debouncedQ)}` : "/", { replace: location.pathname === "/" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q ? `/?search=${encodeURIComponent(q)}` : "/");
  };

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="font-display text-xl font-semibold text-foreground tracking-tight shrink-0 hover:opacity-80 transition-opacity">
          mini<span className="text-primary">shop</span>
        </Link>
        <form className="flex-1 hidden sm:flex max-w-md mx-auto relative" onSubmit={handleSubmit}>
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </form>
        <nav className="flex items-center gap-1 ml-auto sm:ml-0">
          <Link
            to="/"
            className="hidden sm:block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted"
          >
            Catalog
          </Link>
          <Link
            to="/cart"
            className="relative p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            to={user ? "/profile" : "/auth"}
            className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <User size={20} />
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="hidden sm:block px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-xl hover:bg-muted"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
