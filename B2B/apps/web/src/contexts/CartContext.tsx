import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string; // unique id for cart item (uuid)
  productId: string;
  name: string;
  sellerName: string;
  sellerId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  moq: number;
  distance?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "b2b_cart";

export function CartProvider({ children }: { children: ReactNode }): ReactElement {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      }
    } catch (err) {
      console.error("Failed to load cart from localStorage:", err);
    }
    setIsLoaded(true);
  }, []);

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.error("Failed to save cart to localStorage:", err);
      }
    }
  }, [items, isLoaded]);

  function addItem(item: Omit<CartItem, "id">): void {
    // Check if item already exists (same productId + sellerId)
    const existing = items.find(
      (i) => i.productId === item.productId && i.sellerId === item.sellerId
    );

    if (existing) {
      // Update quantity if item exists
      updateQuantity(existing.id, existing.quantity + item.quantity);
    } else {
      // Add new item with unique id
      const newItem: CartItem = {
        ...item,
        id: `${Date.now()}-${Math.random()}`,
      };
      setItems((prev) => [...prev, newItem]);
    }
  }

  function updateQuantity(cartItemId: string, quantity: number): void {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          return { ...item, quantity: Math.max(item.moq, quantity) };
        }
        return item;
      })
    );
  }

  function removeItem(cartItemId: string): void {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  }

  function clearCart(): void {
    setItems([]);
  }

  function getTotalAmount(): number {
    return items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getTotalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
