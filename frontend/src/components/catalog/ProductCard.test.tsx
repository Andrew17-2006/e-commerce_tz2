import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/api";

const baseProduct: Product = {
  id: "1",
  name: "Wireless Noise-Cancelling Headphones",
  description: "Premium over-ear headphones.",
  price: "299",
  stock: 12,
  imageUrl: "https://images.unsplash.com/photo-1505740420928.jpg",
  categoryId: "c1",
  category: { id: "c1", name: "Electronics", slug: "electronics" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderCard(product: Product, onAddToCart = vi.fn()) {
  render(
    <MemoryRouter>
      <ProductCard product={product} onAddToCart={onAddToCart} />
    </MemoryRouter>,
  );
  return { onAddToCart };
}

describe("ProductCard", () => {
  it("shows the name, price, and category", () => {
    renderCard(baseProduct);

    expect(screen.getByText(baseProduct.name)).toBeInTheDocument();
    expect(screen.getByText("$299")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("calls onAddToCart when the Add button is clicked", async () => {
    const { onAddToCart } = renderCard(baseProduct);

    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it("disables the button and shows an out-of-stock label when stock is 0", () => {
    renderCard({ ...baseProduct, stock: 0 });

    const button = screen.getByRole("button", { name: /out of stock/i });
    expect(button).toBeDisabled();
    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });

  it("shows a low-stock badge when only a few units remain", () => {
    renderCard({ ...baseProduct, stock: 3 });

    expect(screen.getByText("3 left")).toBeInTheDocument();
  });
});
