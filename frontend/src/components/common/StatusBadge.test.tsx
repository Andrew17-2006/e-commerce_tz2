import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge, ORDER_STATUSES } from "./StatusBadge";
import type { OrderStatus } from "@/types/api";

const EXPECTED_LABEL: Record<OrderStatus, string> = {
  NEW: "New",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

describe("StatusBadge", () => {
  it.each(ORDER_STATUSES)("renders the correct label for %s", (status) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(EXPECTED_LABEL[status])).toBeInTheDocument();
  });
});
