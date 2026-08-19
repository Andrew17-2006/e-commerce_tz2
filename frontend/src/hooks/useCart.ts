import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/api/cart.api";
import { useAuthStore } from "@/stores/auth.store";
import type { CartItem } from "@/types/api";

const CART_KEY = ["cart"];

export function useCart() {
  const isAuthenticated = !!useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: CART_KEY,
    queryFn: cartApi.get,
    enabled: isAuthenticated,
  });
}

function useOptimisticCartMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  updater: (cart: CartItem[], vars: TVars) => CartItem[],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<CartItem[]>(CART_KEY);
      queryClient.setQueryData<CartItem[]>(CART_KEY, (old) => updater(old ?? [], vars));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
  });
}

export function useAddToCart() {
  return useOptimisticCartMutation(
    ({ productId, qty }: { productId: string; qty: number; product?: CartItem["product"] }) =>
      cartApi.addItem(productId, qty),
    (cart, { productId, qty, product }) => {
      const existing = cart.find((item) => item.productId === productId);
      if (existing) {
        return cart.map((item) =>
          item.productId === productId ? { ...item, qty: item.qty + qty } : item,
        );
      }
      if (!product) return cart;
      return [
        ...cart,
        { id: `optimistic-${productId}`, userId: "", productId, qty, product },
      ];
    },
  );
}

export function useUpdateCartItem() {
  return useOptimisticCartMutation(
    ({ productId, qty }: { productId: string; qty: number }) => cartApi.updateItem(productId, qty),
    (cart, { productId, qty }) =>
      cart.map((item) => (item.productId === productId ? { ...item, qty } : item)),
  );
}

export function useRemoveCartItem() {
  return useOptimisticCartMutation(
    (productId: string) => cartApi.removeItem(productId),
    (cart, productId) => cart.filter((item) => item.productId !== productId),
  );
}
