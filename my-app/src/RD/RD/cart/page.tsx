"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  subscribeToCart,
  increaseQty,
  decreaseQty,
} from "@/services/cart";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Cart = {
  items: Record<string, CartItem>;
  scannedCount?: number;
  detectedCount?: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    return subscribeToCart(setCart);
  }, []);

  if (!cart) {
    return (
      <div className="p-10 text-center text-xl">
        Loading cart...
      </div>
    );
  }

  const items = Object.values(cart.items || {});

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const scanned = cart.scannedCount || 0;
  const detected = cart.detectedCount || 0;

  const verified = scanned === detected;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🛒 Cart</h1>

        <Link
          href="/"
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          ← Back to Products
        </Link>
      </div>

      {/* Verification Banner */}
      <div
        className={`p-4 mb-6 rounded border text-center font-semibold ${
          verified
            ? "bg-green-50 border-green-500 text-green-700"
            : "bg-red-50 border-red-500 text-red-700"
        }`}
      >
        {verified ? "✅ VERIFIED: Cart is clean" : "⚠️ WARNING: Mismatch detected"}
        <div className="text-sm mt-1">
          Scanned: {scanned} | Detected: {detected}
        </div>
      </div>

      {/* Empty Cart */}
      {items.length === 0 && (
        <div className="text-center text-gray-500 text-lg">
          Cart is empty
        </div>
      )}

      {/* Cart Items */}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-center border p-4 rounded mb-4"
        >
          <div>
            <div className="font-semibold text-lg">{item.name}</div>
            <div className="text-sm text-gray-600">
              ₹{item.price} × {item.quantity}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => decreaseQty(item.id)}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                −
              </button>

              <button
                onClick={() => increaseQty(item.id)}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-xl font-bold">
            ₹{item.price * item.quantity}
          </div>
        </div>
      ))}

      {/* Total */}
      {items.length > 0 && (
        <div className="text-right text-2xl font-bold mt-6">
          Total: ₹{total}
        </div>
      )}

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="flex justify-between mt-8">
          <Link
            href="/"
            className="px-6 py-3 border rounded hover:bg-gray-100"
          >
            ← Continue Shopping
          </Link>

          <Link
            href="/checkout"
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Checkout →
          </Link>
        </div>
      )}
    </div>
  );
}
