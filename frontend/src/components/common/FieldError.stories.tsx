import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "./FieldError";

const meta: Meta<typeof FieldError> = {
  title: "Common/FieldError",
  component: FieldError,
};
export default meta;

type Story = StoryObj<typeof FieldError>;

export const NoError: Story = {
  render: () => (
    <div className="w-72">
      <Label>Email</Label>
      <Input placeholder="you@example.com" defaultValue="olena@example.com" />
      <FieldError />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-72">
      <Label>Email</Label>
      <Input placeholder="you@example.com" aria-invalid />
      <FieldError message="Введіть коректну електронну адресу" />
    </div>
  ),
};

/**
 * The actual composition used across the app's forms (Checkout, Auth, Admin
 * products/categories): plain controlled inputs + a local `validate()` that
 * populates an errors map, no React Hook Form / Zod resolver involved.
 */
export const ShippingFormExample: Story = {
  render: () => {
    function Demo() {
      const [name, setName] = useState("");
      const [email, setEmail] = useState("not-an-email");
      const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

      const validate = () => {
        const next: typeof errors = {};
        if (!name.trim()) next.name = "Обов'язкове поле";
        if (!email.includes("@")) next.email = "Введіть коректну електронну адресу";
        setErrors(next);
      };

      return (
        <div className="w-80 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Olena Kovalenko" />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <FieldError message={errors.email} />
          </div>
          <Button onClick={validate}>Validate</Button>
        </div>
      );
    }
    return <Demo />;
  },
};
