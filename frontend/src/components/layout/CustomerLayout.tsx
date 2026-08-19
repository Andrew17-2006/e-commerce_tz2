import { Outlet } from "react-router-dom";
import { CustomerHeader } from "./CustomerHeader";

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
