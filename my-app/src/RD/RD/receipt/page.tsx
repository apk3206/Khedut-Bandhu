"use client";

export default function ReceiptPage() {
  return (
    <div className="p-10 max-w-md mx-auto border">
      <h1 className="text-2xl font-bold text-center mb-4">
        🧾 Smart E-Cart Receipt
      </h1>

      <p className="text-center text-sm mb-4">
        Thank you for shopping!
      </p>

      <hr />

      <div className="mt-4 text-center">
        <p>Payment Successful ✅</p>
        <p className="text-sm text-gray-500 mt-2">
          Please collect your items.
        </p>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 border rounded"
        >
          🖨 Print Receipt
        </button>
      </div>
    </div>
  );
}
