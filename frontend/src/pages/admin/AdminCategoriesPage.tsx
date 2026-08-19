import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/common/FieldError";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/useCategories";
import { apiErrorMessage } from "@/api/client";
import type { Category } from "@/types/api";

interface FormState {
  name: string;
  slug: string;
  description: string;
}

const EMPTY_FORM: FormState = { name: "", slug: "", description: "" };

export function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Обов'язкове поле";
    else if (form.name.length > 120) e.name = "Максимум 120 символів";
    if (!form.slug.trim()) e.slug = "Обов'язкове поле";
    else if (form.slug.length > 120) e.slug = "Максимум 120 символів";
    if (form.description.length > 500) e.description = "Максимум 500 символів";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "" });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!validate()) return;

    const payload = { name: form.name, slug: form.slug, description: form.description || undefined };
    const onSuccess = () => {
      toast.success(editing ? "Category updated" : "Category created");
      setModalOpen(false);
    };
    const onError = (err: unknown) => toast.error(apiErrorMessage(err, "Не вдалося зберегти категорію"));

    if (editing) {
      updateCategory.mutate({ id: editing.id, data: payload }, { onSuccess, onError });
    } else {
      createCategory.mutate(payload, { onSuccess, onError });
    }
  };

  const handleDelete = (cat: Category) => {
    deleteCategory.mutate(cat.id, {
      onSuccess: () => toast.success("Category deleted"),
      onError: (err) => toast.error(apiErrorMessage(err, "У категорії ще є товари — спершу перенесіть або видаліть їх")),
    });
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories?.length ?? 0} categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add category
        </Button>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Slug</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Description</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Products</th>
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
              ) : (
                categories?.map((cat) => (
                  <tr key={cat.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{cat.slug}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cat.description}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-mono">{cat._count?.products ?? 0}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50">
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
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  set("name")(e.target.value);
                  if (!editing) set("slug")(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                }}
                placeholder="e.g. Electronics"
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set("slug")(e.target.value)} placeholder="e.g. electronics" />
              <FieldError message={errors.slug} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Short description" />
              <FieldError message={errors.description} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={createCategory.isPending || updateCategory.isPending}>
                {editing ? "Save changes" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
