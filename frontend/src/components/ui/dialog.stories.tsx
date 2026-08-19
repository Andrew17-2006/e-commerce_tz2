import type { Meta, StoryObj } from "@storybook/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
};
export default meta;

type Story = StoryObj<typeof Dialog>;

export const ProductEditModal: Story = {
  render: () => (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Product name</Label>
            <Input defaultValue="Wireless Noise-Cancelling Headphones" />
          </div>
          <div>
            <Label>Price ($)</Label>
            <Input type="number" defaultValue="299" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1">Cancel</Button>
            <Button className="flex-1">Save changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ),
};
