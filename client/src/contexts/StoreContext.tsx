import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";

type CartItem = { product: Product; quantity: number };
type StoreContextValue = { cart: CartItem[]; cartCount: number; subtotal: number; addToCart: (product: Product, quantity?: number) => void; updateQuantity: (id: number, quantity: number) => void; removeFromCart: (id: number) => void; clearCart: () => void };
const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => { try { return JSON.parse(localStorage.getItem("zanora-cart") || "[]"); } catch { return []; } });
  useEffect(() => { localStorage.setItem("zanora-cart", JSON.stringify(cart)); }, [cart]);
  const value = useMemo(() => ({
    cart,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.reduce((sum, item) => sum + item.product.priceValue * item.quantity, 0),
    addToCart: (product: Product, quantity = 1) => setCart((items) => { const existing = items.find((item) => item.product.id === product.id); return existing ? items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...items, { product, quantity }]; }),
    updateQuantity: (id: number, quantity: number) => setCart((items) => quantity <= 0 ? items.filter((item) => item.product.id !== id) : items.map((item) => item.product.id === id ? { ...item, quantity } : item)),
    removeFromCart: (id: number) => setCart((items) => items.filter((item) => item.product.id !== id)),
    clearCart: () => setCart([]),
  }), [cart]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() { const context = useContext(StoreContext); if (!context) throw new Error("useStore must be used inside StoreProvider"); return context; }
