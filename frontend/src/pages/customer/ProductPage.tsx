import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Stars } from "@/components/catalog/Stars";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useAuthStore } from "@/stores/auth.store";
import { apiErrorMessage } from "@/api/client";
import { cn } from "@/components/ui/utils";

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const addToCart = useAddToCart();
  const isAuthenticated = !!useAuthStore((s) => s.accessToken);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="font-display text-2xl font-semibold mb-4">Product not found</h2>
        <Link to="/" className="text-primary hover:underline">Back to catalog</Link>
      </div>
    );
  }

  const handleAdd = () => {
    if (!isAuthenticated) {
      toast.error("Увійдіть, щоб додати товар у кошик");
      return;
    }
    addToCart.mutate(
      { productId: product.id, qty, product },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Не вдалося додати товар у кошик")),
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to catalog
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
          <ImageWithFallback src={product.imageUrl ?? undefined} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">{product.category.name}</span>
          <h1 className="font-display text-3xl font-semibold text-foreground leading-tight mb-4">{product.name}</h1>
          <div className="flex items-center gap-3 mb-5">
            <Stars />
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6 text-sm">{product.description}</p>
          <div className="flex items-center gap-2 mb-6 p-3 bg-muted/60 rounded-xl">
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                product.stock === 0 ? "bg-red-500" : product.stock <= 5 ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
            <span className="text-sm text-muted-foreground">
              {product.stock === 0
                ? "Out of stock"
                : product.stock <= 5
                  ? `Only ${product.stock} left in stock`
                  : `In stock — ${product.stock} units available`}
            </span>
          </div>
          <div className="mt-auto pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-6">
              <span className="text-4xl font-semibold text-foreground font-mono">
                ${Number(product.price).toFixed(0)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Qty</span>
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2.5 hover:bg-muted transition-colors">
                    <Minus size={15} />
                  </button>
                  <span className="px-4 py-2.5 text-sm font-semibold font-mono min-w-10 text-center border-x border-border">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="px-3 py-2.5 hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleAdd}
              disabled={product.stock === 0}
              variant={added ? "secondary" : "default"}
            >
              {added ? (
                <>
                  <Check size={18} /> Added to cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={18} /> Add to cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
