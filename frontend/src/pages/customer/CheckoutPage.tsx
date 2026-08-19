import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/FieldError";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useOrders";
import { apiErrorMessage } from "@/api/client";
import type { CheckoutPayload } from "@/types/api";

type FormState = CheckoutPayload;

const INITIAL_FORM: FormState = {
  shippingName: "",
  shippingEmail: "",
  shippingPhone: "",
  shippingAddress: "",
  shippingCity: "",
  shippingPostal: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const checkout = useCheckout();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const subtotal = (cart ?? []).reduce((s, i) => s + Number(i.product.price) * i.qty, 0);
  const total = subtotal + (subtotal > 150 ? 0 : 9.99);

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.shippingName.trim()) e.shippingName = "Обов'язкове поле";
    if (!form.shippingEmail.includes("@")) e.shippingEmail = "Введіть коректну електронну адресу";
    if (!form.shippingAddress.trim()) e.shippingAddress = "Обов'язкове поле";
    if (!form.shippingCity.trim()) e.shippingCity = "Обов'язкове поле";
    if (!form.shippingPostal.trim()) e.shippingPostal = "Обов'язкове поле";
    if (form.cardNumber.replace(/\s/g, "").length !== 16) e.cardNumber = "Введіть 16-значний номер";
    if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry)) e.cardExpiry = "Формат ММ/РР";
    if (form.cardCvc.length < 3) e.cardCvc = "3-значний код";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    checkout.mutate(
      { ...form, cardNumber: form.cardNumber.replace(/\s/g, "") },
      {
        onSuccess: (order) => navigate("/checkout/success", { state: { orderId: order.id } }),
        onError: (err) => toast.error(apiErrorMessage(err, "Не вдалося оформити замовлення")),
      },
    );
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button onClick={() => navigate("/")}>Browse catalog</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate("/cart")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Back to cart
      </button>
      <h1 className="font-display text-2xl font-semibold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Contact information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={form.shippingName} onChange={(e) => set("shippingName")(e.target.value)} placeholder="Olena Kovalenko" />
                  <FieldError message={errors.shippingName} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.shippingEmail} onChange={(e) => set("shippingEmail")(e.target.value)} placeholder="you@example.com" />
                  <FieldError message={errors.shippingEmail} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.shippingPhone} onChange={(e) => set("shippingPhone")(e.target.value)} placeholder="+380 50 000 0000" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Shipping address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Street address</Label>
                  <Input value={form.shippingAddress} onChange={(e) => set("shippingAddress")(e.target.value)} placeholder="Khreshchatyk St, 1" />
                  <FieldError message={errors.shippingAddress} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.shippingCity} onChange={(e) => set("shippingCity")(e.target.value)} placeholder="Kyiv" />
                  <FieldError message={errors.shippingCity} />
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input value={form.shippingPostal} onChange={(e) => set("shippingPostal")(e.target.value)} placeholder="01001" />
                  <FieldError message={errors.shippingPostal} />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-1">Payment</h2>
              <p className="text-xs text-muted-foreground mb-4">Demo mode — no real transaction will occur</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Card number</Label>
                  <Input
                    value={form.cardNumber}
                    onChange={(e) => set("cardNumber")(e.target.value.replace(/[^\d]/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))}
                    placeholder="1234 5678 9012 3456"
                  />
                  <FieldError message={errors.cardNumber} />
                </div>
                <div>
                  <Label>Expiry</Label>
                  <Input
                    value={form.cardExpiry}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      set("cardExpiry")(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    }}
                    placeholder="MM/YY"
                  />
                  <FieldError message={errors.cardExpiry} />
                </div>
                <div>
                  <Label>CVC</Label>
                  <Input value={form.cardCvc} onChange={(e) => set("cardCvc")(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="123" />
                  <FieldError message={errors.cardCvc} />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-6 lg:sticky lg:top-24">
              <h2 className="font-semibold text-foreground mb-4">Order summary</h2>
              <div className="space-y-2.5 mb-4">
                {cart.map(({ product, qty }) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{product.name} ×{qty}</span>
                    <span className="font-mono font-medium shrink-0">${(Number(product.price) * qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{subtotal > 150 ? "Free" : "$9.99"}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground text-base pt-1">
                  <span>Total</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
              </div>
              <Button type="submit" className="w-full mt-5" size="lg" disabled={checkout.isPending}>
                {checkout.isPending ? "Processing…" : "Place order"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
