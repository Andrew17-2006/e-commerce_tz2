import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAddToCart } from "@/hooks/useCart";
import { useAuthStore } from "@/stores/auth.store";
import { CategoryPill } from "@/components/catalog/CategoryPill";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SkeletonCard } from "@/components/catalog/SkeletonCard";
import { apiErrorMessage } from "@/api/client";
import type { ProductQuery } from "@/types/api";

const PER_PAGE = 6;

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<ProductQuery["sort"]>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data: categories } = useCategories();
  const query: ProductQuery = {
    page,
    limit: PER_PAGE,
    search: search || undefined,
    categoryId,
    sort,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  };
  const { data, isLoading } = useProducts(query);
  const addToCart = useAddToCart();
  const isAuthenticated = !!useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    setSearch(urlSearch);
    setPage(1);
  }, [searchParams]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;

  const handleAddToCart = (productId: string, productName: string) => {
    if (!isAuthenticated) {
      toast.error("Увійдіть, щоб додати товар у кошик");
      return;
    }
    addToCart.mutate(
      { productId, qty: 1, product: data?.items.find((p) => p.id === productId) },
      {
        onSuccess: () => toast.success(`${productName.split(" ").slice(0, 3).join(" ")} added to cart`),
        onError: (err) => toast.error(apiErrorMessage(err, "Не вдалося додати товар у кошик")),
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 sm:hidden">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setSearchParams(e.target.value ? { search: e.target.value } : {});
            }}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {data?.total ?? 0} products
          </span>
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            placeholder="Min $"
            className="w-20 px-3 py-2.5 rounded-xl bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            placeholder="Max $"
            className="w-20 px-3 py-2.5 rounded-xl bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as ProductQuery["sort"]);
                setPage(1);
              }}
              className="appearance-none px-4 py-2.5 pr-9 rounded-xl bg-input-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-8">
        <CategoryPill active={!categoryId} onClick={() => { setCategoryId(undefined); setPage(1); }}>
          All
        </CategoryPill>
        {categories?.map((c) => (
          <CategoryPill key={c.id} active={categoryId === c.id} onClick={() => { setCategoryId(c.id); setPage(1); }}>
            {c.name}
          </CategoryPill>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setCategoryId(undefined); setSearchParams({}); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={() => handleAddToCart(product.id, product.name)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    page === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
