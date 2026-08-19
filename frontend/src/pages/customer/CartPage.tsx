import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/catalog/SkeletonCard";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { apiErrorMessage } from "@/api/client";

export function CartPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6">
          <ShoppingCart size={32} className="text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8 text-sm">Add some products and come back here</p>
        <Button size="lg" onClick={() => navigate("/")}>Browse catalog</Button>
      </div>
    );
  }

  const subtotal = cart.reduce((s, i) => s + Number(i.product.price) * i.qty, 0);
  const shipping = subtotal > 150 ? 0 : 9.99;
  const total = subtotal + shipping;

  const handleUpdate = (productId: string, qty: number) => {
    if (qty < 1) {
      removeItem.mutate(productId, { onError: (err) => toast.error(apiErrorMessage(err)) });
      return;
    }
    updateItem.mutate({ productId, qty }, { onError: (err) => toast.error(apiErrorMessage(err)) });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-semibold mb-8">
        Your cart <span className="text-muted-foreground font-sans text-lg font-normal">({cart.length})</span>
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {cart.map(({ product, qty }) => (
            <div key={product.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4">
              <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden shrink-0">
                <ImageWithFallback src={product.imageUrl ?? undefined} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 mb-0.5">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">{product.category.name}</p>
                    <Link to={`/products/${product.id}`} className="text-sm font-medium text-foreground leading-snug truncate hover:text-primary block">
                      {product.name}
                    </Link>
                  </div>
                  <button
                    onClick={() => handleUpdate(product.id, 0)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button onClick={() => handleUpdate(product.id, qty - 1)} className="px-2.5 py-1.5 hover:bg-muted transition-colors">
                      <Minus size={13} />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-mono font-semibold border-x border-border min-w-9 text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleUpdate(product.id, qty + 1)}
                      disabled={qty >= product.stock}
                      className="px-2.5 py-1.5 hover:bg-muted transition-colors disabled:opacity-30"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="font-semibold text-foreground font-mono">${(Number(product.price) * qty).toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-semibold text-foreground mb-5">Order summary</h2>
          <div className="space-y-3 text-sm mb-5">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-mono">{shipping === 0 ? "Free" : `$${shipping}`}</span>
            </div>
            {subtotal <= 150 && (
              <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                Add ${(150 - subtotal).toFixed(0)} more for free shipping
              </p>
            )}
            {shipping === 0 && (
              <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                Free shipping applied!
              </p>
            )}
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-foreground text-base">
              <span>Total</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
            Checkout <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
