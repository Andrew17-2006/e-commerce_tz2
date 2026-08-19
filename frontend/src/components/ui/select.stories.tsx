import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
};
export default meta;

type Story = StoryObj<typeof Select>;

export const CategoryFilter: Story = {
  render: () => (
    <Select defaultValue="electronics">
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="electronics">Electronics</SelectItem>
        <SelectItem value="home">Home</SelectItem>
        <SelectItem value="kitchen">Kitchen</SelectItem>
        <SelectItem value="accessories">Accessories</SelectItem>
        <SelectItem value="sports">Sports</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const SortOrder: Story = {
  render: () => (
    <Select defaultValue="newest">
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price-asc">Price ↑</SelectItem>
        <SelectItem value="price-desc">Price ↓</SelectItem>
      </SelectContent>
    </Select>
  ),
};
