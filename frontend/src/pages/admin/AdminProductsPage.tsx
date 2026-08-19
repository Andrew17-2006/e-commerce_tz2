import { useState } from "react";
import { Check, Edit2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/common/FieldError";
import { useCategories } from "@/hooks/useCategories";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
  useUploadProductImage,
} from "@/hooks/useProducts";
import { apiErrorMessage } from "@/api/client";
import type { Product } from "@/types/api";

interface FormState {
  name: string;
  categoryId: string;
  price: string;
  stock: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: FormState = { name: "", categoryId: "", price: "", stock: "", description: "", imageUrl: "" };

export function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const { data: categories } = useCategories();
  const { data, isLoading } = useProducts({ page: 1, limit: 100, search: search || undefined, sort: "newest" });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Обов'язкове поле";
    if (!form.categoryId) e.categoryId = "Оберіть категорію";
    if (form.price.trim() === "" || Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
      e.price = "Ціна має бути числом не менше 0";
    }
    if (form.stock.trim() === "" || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      e.stock = "Кількість має бути цілим числом не менше 0";
    }
    if (!form.description.trim()) e.description = "Обов'язкове поле";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoryId: categories?.[0]?.id ?? "" });
    setImageFile(null);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description,
      imageUrl: product.imageUrl ?? "",
    });
    setImageFile(null);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description,
      imageUrl: form.imageUrl || undefined,
    };

    try {
      let product: Product;
      if (editing) {
        product = await updateProduct.mutateAsync({ id: editing.id, data: payload });
      } else {
        product = await createProduct.mutateAsync(payload);
      }
      if (imageFile) {
        await uploadImage.mutateAsync({ id: product.id, file: imageFile });
      }
      toast.success(editing ? "Product updated" : "Product created");
      setModalOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Не вдалося зберегти товар"));
    }
  };

  const handleDelete = (product: Product) => {
    deleteProduct.mutate(product.id, {
      onSuccess: () => toast.success("Product deleted"),
      onError: (err) => toast.error(apiErrorMessage(err, "Не вдалося видалити товар")),
    });
  };

  return (
    <div className="p-6 w-full">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-56" />
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add product
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Category</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Stock</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Товарів не знайдено
                  </td>
                </tr>
              ) : (
                data?.items.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{product.category.name}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-mono">${Number(product.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      <span className={product.stock === 0 ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : "text-foreground"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50">
                          <Trash2 size={15} />
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product name</Label>
              <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Wireless Headphones" />
              <FieldError message={errors.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={set("categoryId")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.categoryId} />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input type="number" value={form.price} onChange={(e) => set("price")(e.target.value)} placeholder="0.00" />
                <FieldError message={errors.price} />
              </div>
            </div>
            <div>
              <Label>Stock quantity</Label>
              <Input type="number" value={form.stock} onChange={(e) => set("stock")(e.target.value)} placeholder="0" />
              <FieldError message={errors.stock} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={(e) => set("imageUrl")(e.target.value)} placeholder="https://images.unsplash.com/…" />
            </div>
            <div>
              <Label>Or upload an image file</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-foreground"
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                rows={3}
                placeholder="Product description…"
                className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
              <FieldError message={errors.description} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={createProduct.isPending || updateProduct.isPending || uploadImage.isPending}
              >
                <Check size={16} /> {editing ? "Save changes" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
