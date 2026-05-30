import type { ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, type CartItem as ContextCartItem } from "../contexts/CartContext";

export function CartPage(): ReactElement {
  const navigate = useNavigate();
  const { items: cartItems, updateQuantity, removeItem, getTotalAmount } = useCart();
  const [, setTick] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group items by seller
  const groupedBySeller = cartItems.reduce(
    (acc, item) => {
      const existing = acc.find((g) => g.sellerId === item.sellerId);
      if (existing) {
        existing.items.push(item);
      } else {
        acc.push({ sellerId: item.sellerId, sellerName: item.sellerName, items: [item] });
      }
      return acc;
    },
    [] as Array<{ sellerId: string; sellerName: string; items: ContextCartItem[] }>
  );

  function handleUpdateQuantity(id: string, delta: number): void {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < item.moq) {
      setToastMessage(`⚠️ Minimum order for ${item.name} is ${item.moq} ${item.unit}`);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    updateQuantity(id, newQty);
    // force rerender to reflect updated context state if needed
    setTick((t) => t + 1);
  }

  function handleRemoveItem(id: string): void {
    removeItem(id);
  }

  const totalAmount = getTotalAmount();

  if (cartItems.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background p-12 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold text-darkText">Your cart is empty</h1>
        <p className="mt-2 text-grayText">Start adding products to get started!</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="btn-primary mt-6 px-6 py-3"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed right-4 top-20 z-[70] rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800 shadow">
          {toastMessage}
        </div>
      )}
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-darkText">Shopping Cart</h1>
        <p className="mt-1 text-sm text-grayText">{cartItems.length} items from {groupedBySeller.length} seller(s)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Cart */}
        <div className="lg:col-span-2 space-y-4">
          {groupedBySeller.map((group) => (
            <div key={group.sellerId} className="rounded-2xl border border-border bg-background overflow-hidden">
              {/* Seller Header */}
              <div className="bg-lightGreen/40 border-b border-border px-5 py-3">
                <p className="font-bold text-darkText">🏢 {group.sellerName}</p>
                <p className="text-xs text-grayText mt-1">{group.items.length} item(s)</p>
              </div>

              {/* Items */}
              <div className="divide-y divide-border p-5 space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    {/* Product Image Placeholder */}
                    <div className="h-20 w-20 rounded-lg bg-lightGreen/40 flex items-center justify-center shrink-0">
                      📦
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-darkText">{item.name}</h3>
                      <p className="text-xs font-bold text-yellow-800 bg-yellow-100 inline-block px-2 py-1 rounded mt-1">🔔 Min: {item.moq} {item.unit}</p>

                      {/* Quantity Selector */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= item.moq}
                          className={`h-10 w-10 rounded border text-base font-bold transition-colors ${
                            item.quantity <= item.moq
                              ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-border bg-white text-darkText hover:bg-lightGreen"
                          }`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newVal = Number(e.target.value) || item.moq;
                            if (newVal < item.moq) {
                              setToastMessage(`⚠️ Minimum order for ${item.name} is ${item.moq} ${item.unit}`);
                              setTimeout(() => setToastMessage(null), 2500);
                              return;
                            }
                            updateQuantity(item.id, newVal);
                            setTick((t) => t + 1);
                          }}
                          className="h-10 w-16 rounded border border-border px-3 py-2 text-center text-sm font-bold text-darkText outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="h-10 w-10 rounded border border-border text-base font-bold text-darkText hover:bg-lightGreen transition-colors"
                        >
                          +
                        </button>
                        <span className="ml-auto text-xs text-grayText">{item.unit}</span>
                      </div>
                    </div>

                    {/* Price & Remove */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₹{(item.quantity * item.pricePerUnit).toFixed(2)}</p>
                      <p className="text-xs text-grayText mt-1">₹{item.pricePerUnit} each</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="mt-3 text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seller Footer */}
              <div className="border-t border-border bg-lightGreen/20 px-5 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-grayText">Subtotal for this seller:</span>
                  <span className="font-bold text-darkText">
                    ₹{group.items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1 h-fit rounded-2xl border border-border bg-background p-5 sticky top-24">
          <h2 className="font-bold text-darkText mb-4">Order Summary</h2>

          <div className="space-y-3 border-b border-border pb-4">
            <div className="flex justify-between text-sm">
              <span className="text-grayText">Subtotal</span>
              <span className="text-darkText">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grayText">Transport (Est.)</span>
              <span className="text-darkText">₹{(totalAmount * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grayText">GST (5%)</span>
              <span className="text-darkText">₹{(totalAmount * 0.05).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between font-bold text-lg">
            <span className="text-darkText">Total</span>
            <span className="text-primary">₹{(totalAmount * 1.1).toFixed(2)}</span>
          </div>

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="btn-primary w-full py-3"
            >
              Proceed to Checkout
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-xl border border-primary bg-white px-4 py-3 font-medium text-primary hover:bg-lightGreen transition-colors"
            >
              Continue Shopping
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg bg-lightGreen/40 p-3 text-xs text-darkText space-y-2">
            <p>✅ Free shipping on orders above ₹5000</p>
            <p>✅ Secure payments with multiple options</p>
            <p>✅ 24/7 customer support</p>
          </div>
        </div>
      </div>
    </div>
  );
}
