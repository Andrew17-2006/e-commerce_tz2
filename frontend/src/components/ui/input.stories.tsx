import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  args: { placeholder: "you@example.com" },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label>Email</Label>
      <Input {...args} />
    </div>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label>Email</Label>
      <Input {...args} className="border-destructive" />
      <p className="text-xs text-destructive">Valid email required</p>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true, value: "Read only" } };
