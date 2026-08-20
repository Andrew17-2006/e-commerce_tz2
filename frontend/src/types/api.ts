export type Role = "CUSTOMER" | "ADMIN";
export type OrderStatus = "NEW" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl?: string | null;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  qty: number;
  product: Product;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: string;
  qty: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone?: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: { name: string; email: string };
}

export interface CheckoutPayload {
  shippingName: string;
  shippingEmail: string;
  shippingPhone?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sold: number;
  revenue: number;
}

export interface SalesByDay {
  date: string;
  revenue: number;
  orders: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
