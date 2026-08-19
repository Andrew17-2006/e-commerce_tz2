import { Star } from "lucide-react";

export function Stars({ rating = 4.5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted"}
        />
      ))}
    </div>
  );
}
