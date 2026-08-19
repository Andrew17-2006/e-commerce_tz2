import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge, ORDER_STATUSES } from "./StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "Common/StatusBadge",
  component: StatusBadge,
};
export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const New: Story = { args: { status: "NEW" } };
export const Processing: Story = { args: { status: "PROCESSING" } };
export const Shipped: Story = { args: { status: "SHIPPED" } };
export const Completed: Story = { args: { status: "COMPLETED" } };
export const Cancelled: Story = { args: { status: "CANCELLED" } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      {ORDER_STATUSES.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
