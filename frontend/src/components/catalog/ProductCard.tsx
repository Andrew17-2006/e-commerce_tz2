import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Stars } from "./Stars";
import type { Product } from "@/types/api";

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: () => void;
}) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden bg-muted h-52">
        <ImageWithFallback
          src={product.imageUrl ?? undefined}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[11px] font-semibold px-2.5 py-1 rounded-full text-foreground border border-border/30 uppercase tracking-wide">
          {product.category.name}
        </span>
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3 right-3 bg-amber-50 text-amber-700 text-[11px] font-medium px-2 py-1 rounded-full border border-amber-200">
            {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 right-3 bg-red-50 text-red-700 text-[11px] font-medium px-2 py-1 rounded-full border border-red-200">
            Sold out
          </span>
        )}
      </Link>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Stars />
        </div>
        <Link
          to={`/products/${product.id}`}
          className="block text-sm font-medium text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors mb-3"
        >
          {product.name}
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground font-mono">
            ${Number(product.price).toFixed(0)}
          </span>
          <Button size="sm" variant={added ? "secondary" : "default"} onClick={handleAdd} disabled={product.stock === 0}>
            {product.stock === 0 ? (
              "Out of stock"
            ) : added ? (
              <>
                <Check size={13} /> Added
              </>
            ) : (
              <>
                <Plus size={13} /> Add
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
