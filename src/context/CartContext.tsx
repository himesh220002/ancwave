"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, ProductColor } from "@/types";

export interface CustomerCheckoutDetails {
  fullName: string;
  email: string;
  contact: string;
  country: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export const initialCustomerDetails: CustomerCheckoutDetails = {
  fullName: "Alex Morgan",
  email: "alex@example.com",
  contact: "+1 503 555 0199",
  country: "United States",
  address: "1420 NW Johnson Street",
  city: "Portland",
  state: "Oregon",
  zipCode: "97209",
};

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variant: ProductColor, component?: string) => void;
  updateQuantity: (productId: string, variant: ProductColor, delta: number, component?: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  recentAddedFlash: boolean;
  setRecentAddedFlash: (flash: boolean) => void;
  customerDetails: CustomerCheckoutDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CustomerCheckoutDetails>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Start empty so cart does not auto-populate on page refresh
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [recentAddedFlash, setRecentAddedFlash] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerCheckoutDetails>(initialCustomerDetails);

  // Sync with local storage on initial mount only
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("ancwave_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
      const savedCustomer = localStorage.getItem("ancwave_customer");
      if (savedCustomer) {
        const parsedCustomer = JSON.parse(savedCustomer);
        if (parsedCustomer && typeof parsedCustomer === "object") {
          setCustomerDetails(parsedCustomer);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save customer details whenever they change (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("ancwave_customer", JSON.stringify(customerDetails));
    } catch {
      // ignore
    }
  }, [customerDetails, isInitialized]);

  // Sync items to local storage whenever items change (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("ancwave_cart", JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isInitialized]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.variant === item.variant &&
          (i.component || "") === (item.component || "")
      );

      if (existingIndex > -1) {
        return prev.map((it, idx) =>
          idx === existingIndex
            ? { ...it, quantity: it.quantity + quantity }
            : it
        );
      }

      return [...prev, { ...item, quantity }];
    });

    setRecentAddedFlash(true);
    setIsCartOpen(true);
  };

  const removeItem = (productId: string, variant: ProductColor, component?: string) => {
    setItems((prev) => {
      const updated = prev.filter(
        (i) =>
          !(
            i.productId === productId &&
            i.variant === variant &&
            (i.component || "") === (component || "")
          )
      );
      try {
        localStorage.setItem("ancwave_cart", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const updateQuantity = (
    productId: string,
    variant: ProductColor,
    delta: number,
    component?: string
  ) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (
            it.productId === productId &&
            it.variant === variant &&
            (it.component || "") === (component || "")
          ) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.setItem("ancwave_cart", JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = totalItemsCount > 0 ? 12.0 : 0.0;
  const tax = 0.0;
  const total = subtotal + shipping + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        shipping,
        tax,
        total,
        recentAddedFlash,
        setRecentAddedFlash,
        customerDetails,
        setCustomerDetails,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
