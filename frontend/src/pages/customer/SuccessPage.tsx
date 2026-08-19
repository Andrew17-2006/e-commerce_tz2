import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = (location.state as { orderId?: string } | null)?.orderId;

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={36} className="text-emerald-600" />
      </div>
      <h1 className="font-display text-2xl font-semibold mb-2">Order confirmed!</h1>
      <p className="text-muted-foreground mb-2 text-sm">Thank you — your order is being processed.</p>
      {orderId && <p className="text-sm font-mono text-muted-foreground mb-8">#{orderId}</p>}
      <Button size="lg" onClick={() => navigate("/")}>Continue shopping</Button>
    </div>
  );
}
