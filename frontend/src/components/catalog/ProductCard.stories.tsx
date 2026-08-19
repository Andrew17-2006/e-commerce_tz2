import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/api";

const baseProduct: Product = {
  id: "1",
  name: "Wireless Noise-Cancelling Headphones",
  description: "Premium over-ear headphones with 30-hour battery life.",
  price: "299",
  stock: 12,
  imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format",
  categoryId: "c1",
  category: { id: "c1", name: "Electronics", slug: "electronics" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const meta: Meta<typeof ProductCard> = {
  title: "Catalog/ProductCard",
  component: ProductCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="max-w-xs">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: { onAddToCart: () => {} },
};
export default meta;

type Story = StoryObj<typeof ProductCard>;

export const InStock: Story = { args: { product: baseProduct } };

export const LowStock: Story = { args: { product: { ...baseProduct, stock: 3 } } };

export const OutOfStock: Story = { args: { product: { ...baseProduct, stock: 0 } } };
