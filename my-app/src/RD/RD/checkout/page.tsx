"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToCart, clearCart } from "@/services/cart";

type CartItem = {
  name: string;
  price: number;
  quantity: number;
};

type Cart = {
  items: Record<string, CartItem>;
  scannedCount?: number;
  detectedCount?: number;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = subscribeToCart((data) => {
      setCart(data);
    });
    return () => unsub();
  }, []);

  if (!cart || !cart.items || Object.keys(cart.items).length === 0) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">🧾 Checkout</h1>
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ← Go to Products
        </button>
      </div>
    );
  }

  const items = Object.values(cart.items);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 🔐 Verification logic (can be forced true if needed)
  const scanned = cart.scannedCount ?? items.reduce((s, i) => s + i.quantity, 0);
  const detected = cart.detectedCount ?? scanned;
  const verified = scanned === detected;

  const upiId = "rudraxdhameliya@oksbi"; // ✅ YOUR UPI ID
  const payUrl = `upi://pay?pa=${upiId}&pn=SmartECart&am=${total}&cu=INR`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    payUrl
  )}`;

  async function completePayment() {
    alert("✅ Payment Successful!");
    await clearCart();
    router.push("/receipt");
  }

  return (
    <div className="p-10 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">💳 Checkout</h1>

      {/* Verification Status */}
      <div
        className={`p-4 mb-6 rounded border ${
          verified
            ? "bg-green-50 border-green-500 text-green-700"
            : "bg-red-50 border-red-500 text-red-700"
        }`}
      >
        <div className="font-bold">
          {verified ? "✅ Cart Verified" : "⚠️ Cart Mismatch Detected"}
        </div>
        <div className="text-sm mt-1">
          Scanned: {scanned} | Detected: {detected}
        </div>
      </div>

      <div className="text-xl font-bold mb-4">Total: ₹{total}</div>

      {/* QR Code */}
      <img src={qrUrl} className="mx-auto border p-2 rounded" />

      <p className="mt-4 text-gray-600">Scan & Pay using any UPI app</p>

      {/* Pay Button */}
      <button
        onClick={completePayment}
        disabled={!verified}
        className={`mt-6 px-6 py-3 rounded text-white text-lg ${
          verified
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Pay Now
      </button>

      {!verified && (
        <p className="text-red-600 text-sm mt-4">
          Payment blocked because cart verification failed.
        </p>
      )}
    </div>
  );
}
