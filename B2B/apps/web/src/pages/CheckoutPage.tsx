import type { ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { placeOrder } from "../api/orders";

type CheckoutStep = 1 | 2 | 3 | 4;
type PaymentMethod = "upi" | "bank" | "cod" | "credit";

export function CheckoutPage(): ReactElement {
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [selectedTransport, setSelectedTransport] = useState("standard");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("upi");
  const { items, clearCart, getTotalAmount } = useCart();
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const [deliveryAddress, setDeliveryAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const totalAmount = getTotalAmount();
  const transportCost = selectedTransport === "standard" ? 500 : selectedTransport === "express" ? 1200 : 2500;
  const gst = Number((totalAmount * 0.05).toFixed(2));
  const finalTotal = totalAmount + transportCost + gst;

  const steps: { num: CheckoutStep; label: string; icon: string }[] = [
    { num: 1, label: "Delivery", icon: "📍" },
    { num: 2, label: "Transport", icon: "🚚" },
    { num: 3, label: "Invoice", icon: "📋" },
    { num: 4, label: "Payment", icon: "💳" },
  ];

  async function handlePlaceOrders() {
    if (items.length === 0) {
      window.alert("Your cart is empty.");
      return;
    }

    setPlacing(true);
    setPlaceError(null);

    try {
      const promises = items.map((it) => placeOrder({ productId: it.productId, quantity: it.quantity }));
      const results = await Promise.allSettled(promises);

      const rejected = results.find((r) => r.status === "rejected");
      if (rejected) {
        setPlaceError("Failed to place some orders. Please try again.");
        setPlacing(false);
        return;
      }

      // success
      clearCart();
      navigate("/buyer/orders");
    } catch (err) {
      setPlaceError(String(err ?? "Unknown error"));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                  step === s.num
                    ? "bg-primary text-white"
                    : step > s.num
                      ? "bg-lightGreen text-primary"
                      : "bg-border text-grayText"
                }`}
              >
                {s.icon}
              </button>
              <div>
                <p className="text-xs font-semibold text-grayText">Step {s.num}</p>
                <p className="font-medium text-darkText">{s.label}</p>
              </div>
              {idx < steps.length - 1 ? (
                <div className={`h-1 w-12 mx-2 rounded ${step > s.num ? "bg-primary" : "bg-border"}`} />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* STEP 1: Delivery Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-darkText">Delivery Address</h2>

              <form className="space-y-4 rounded-2xl border border-border bg-background p-6">
                <div>
                  <label className="block text-sm font-medium text-darkText mb-2">Full Name</label>
                  <input
                    type="text"
                    value={deliveryAddress.name}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-border px-4 py-3 text-darkText outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkText mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-border px-4 py-3 text-darkText outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkText mb-2">Delivery Address</label>
                  <textarea
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                    placeholder="123 Business Park, Main Street"
                    className="w-full rounded-xl border border-border px-4 py-3 text-darkText outline-none focus:border-primary"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-darkText mb-2">City</label>
                    <input
                      type="text"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      placeholder="Delhi"
                      className="w-full rounded-xl border border-border px-4 py-3 text-darkText outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-darkText mb-2">Pincode</label>
                    <input
                      type="text"
                      value={deliveryAddress.pincode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                      placeholder="110001"
                      className="w-full rounded-xl border border-border px-4 py-3 text-darkText outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-3 mt-4"
                >
                  Continue to Transport
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Transport Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-darkText">Select Transport & ETA</h2>

              <div className="space-y-3 rounded-2xl border border-border bg-background p-6">
                {[
                  { id: "standard", name: "Standard Delivery", eta: "3-5 days", price: 500, badge: "Economy" },
                  { id: "express", name: "Express Delivery", eta: "1-2 days", price: 1200, badge: "Popular" },
                  { id: "sameday", name: "Same Day Delivery", eta: "Today", price: 2500, badge: "Premium" },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                      selectedTransport === option.id
                        ? "border-primary bg-lightGreen/40"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="transport"
                      value={option.id}
                      checked={selectedTransport === option.id}
                      onChange={() => setSelectedTransport(option.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-darkText">{option.name}</p>
                      <p className="text-xs text-grayText mt-1">ETA: {option.eta}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          {option.badge}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-primary">₹{option.price}</p>
                  </label>
                ))}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-border bg-white px-4 py-3 font-medium text-darkText hover:bg-lightGreen transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn-primary flex-1 py-3"
                  >
                    Continue to Invoice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Invoice Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-darkText">Invoice Summary</h2>

              <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
                {/* Order Items */}
                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-grayText">Fresh Milk 1L × 100</span>
                    <span className="font-semibold text-darkText">₹4,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-grayText">Red Chili Powder × 25</span>
                    <span className="font-semibold text-darkText">₹1,000</span>
                  </div>
                </div>

                {/* Charges */}
                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-grayText">Subtotal</span>
                    <span className="text-darkText">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-grayText">Transport</span>
                    <span className="text-darkText">₹{transportCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-grayText">GST (5%)</span>
                    <span className="text-darkText">₹{gst.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-darkText">Total Amount</span>
                  <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
                </div>

                {/* Terms */}
                <div className="rounded-lg bg-lightGreen/40 p-3 text-xs text-darkText space-y-1">
                  <p>✅ Secure payment verified</p>
                  <p>✅ Quality assurance included</p>
                  <p>✅ 30-day return policy</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 rounded-xl border border-border bg-white px-4 py-3 font-medium text-darkText hover:bg-lightGreen transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="btn-primary flex-1 py-3"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Options */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-darkText">Choose Payment Method</h2>

              <div className="space-y-3 rounded-2xl border border-border bg-background p-6">
                {[
                  { id: "upi" as PaymentMethod, name: "UPI", icon: "📱", desc: "Instant payment via UPI" },
                  { id: "bank" as PaymentMethod, name: "Bank Transfer", icon: "🏦", desc: "Direct bank account transfer" },
                  { id: "cod" as PaymentMethod, name: "Cash on Delivery", icon: "💵", desc: "Pay when delivery arrives" },
                  {
                    id: "credit" as PaymentMethod,
                    name: "B2B Credits",
                    icon: "💳",
                    desc: "Use your available credits",
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                      selectedPayment === option.id
                        ? "border-primary bg-lightGreen/40"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.id}
                      checked={selectedPayment === option.id}
                      onChange={() => setSelectedPayment(option.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-darkText flex items-center gap-2">
                        <span className="text-2xl">{option.icon}</span>
                        {option.name}
                      </p>
                      <p className="text-xs text-grayText mt-1">{option.desc}</p>
                    </div>
                  </label>
                ))}

                <div className="mt-6 rounded-lg bg-lightGreen/40 p-4 space-y-2">
                  <p className="text-sm font-semibold text-darkText">Final Amount: ₹{finalTotal.toFixed(2)}</p>
                  <p className="text-xs text-grayText">
                    By proceeding, you agree to our terms and conditions.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-xl border border-border bg-white px-4 py-3 font-medium text-darkText hover:bg-lightGreen transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePlaceOrders()}
                    disabled={placing}
                    className="btn-primary flex-1 py-3 text-lg disabled:opacity-60"
                  >
                    {placing ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Order Summary */}
        <div className="lg:col-span-1 h-fit rounded-2xl border border-border bg-background p-5 sticky top-24">
          <h2 className="font-bold text-darkText mb-4">Order Summary</h2>

          <div className="space-y-3 border-b border-border pb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-grayText">Subtotal</span>
              <span className="text-darkText">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grayText">
                Transport
                <br />
                (
                {selectedTransport === "standard"
                  ? "Standard"
                  : selectedTransport === "express"
                    ? "Express"
                    : "Same Day"}
                )
              </span>
              <span className="text-darkText">
                ₹
                {selectedTransport === "standard"
                  ? "500"
                  : selectedTransport === "express"
                    ? "1200"
                    : "2500"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-grayText">GST (5%)</span>
              <span className="text-darkText">₹{gst.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between font-bold text-lg">
            <span className="text-darkText">Total</span>
            <span className="text-primary">
              ₹
              {(
                totalAmount +
                (selectedTransport === "standard"
                  ? 500
                  : selectedTransport === "express"
                    ? 1200
                    : 2500) +
                gst
              ).toFixed(2)}
            </span>
          </div>

          <div className="mt-6 rounded-lg bg-lightGreen/40 p-3 text-xs text-darkText space-y-2">
            <p>📍 Delivery to: {deliveryAddress.city || "Your location"}</p>
            <p>⏱️ Estimated arrival based on selected transport</p>
          </div>
        </div>
      </div>
    </div>
  );
}
