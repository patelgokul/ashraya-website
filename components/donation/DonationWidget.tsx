"use client";
import { useState } from "react";
import { Heart, Repeat } from "lucide-react";
import { SITE } from "@/lib/site";

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

const IMPACT_MAP: Record<number, string> = {
  500: "📚 Educational kit for 1 child",
  1000: "🍱 Mid-day meals for 10 children (1 month)",
  2500: "🧵 Skill development support for 1 woman",
  5000: "🏘️ Community development fund contribution",
  10000: "⭐ Sponsor an entire program module",
};

interface Props {
  campaignId: string;
  campaignTitle?: string;
}

export function DonationWidget({ campaignId, campaignTitle }: Props) {
  const [type, setType] = useState<"once" | "monthly">("once");
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalAmount = custom ? Number(custom) : amount;
  const impact = IMPACT_MAP[amount];
   
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // async function handleDonate() {
  //   setError("");
  //   if (!donorName || !donorEmail) {
  //     setError("Please enter your name and email.");
  //     return;
  //   }

  const [emailTouched, setEmailTouched] = useState(false);
const emailValid = donorEmail === "" || EMAIL_REGEX.test(donorEmail);

<input
  type="email"
  placeholder="Your email address *"
  value={donorEmail}
  onChange={(e) => setDonorEmail(e.target.value)}
  onBlur={() => setEmailTouched(true)}
  className={`w-full border ${
    emailTouched && !emailValid ? "border-red-400" : "border-gray-200"
  } focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
/>
{emailTouched && !emailValid && (
  <p className="text-red-500 text-xs mt-1">Please enter a valid email address.</p>
)}

   async function handleDonate() {
  setError("");
  if (!donorName || !donorEmail) {
    setError("Please enter your name and email.");
    return;
  }

  if (!EMAIL_REGEX.test(donorEmail)) {
    setError("Please enter a valid email address.");
    return;
  }

  if (donorPhone && (donorPhone.length !== 10 || !/^[6-9]/.test(donorPhone))) {
    setError("Please enter a valid 10-digit Indian mobile number.");
    return;
  }

    if (finalAmount < 10) {
      setError("Minimum donation is ₹10.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, campaignId, donorName, donorEmail, donorPhone, message }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const { orderId, donationId } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: finalAmount * 100,
        currency: "INR",
        name: SITE.name,
        description: campaignTitle || "Making a Difference Together",
        image: SITE.icon,
        order_id: orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, donationId }),
          });
          if (verifyRes.ok) {
            window.location.href = "/payment-success";
          } else {
            window.location.href = "/payment-failed";
          }
        },
        // prefill: { name: donorName, email: donorEmail, contact: donorPhone },
        prefill: { name: donorName, email: donorEmail, contact: donorPhone ? `+91${donorPhone}` : "" },
        notes: { campaignId, campaignTitle },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Payment initialization failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Type Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setType("once")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            type === "once" ? "bg-white shadow text-gray-900" : "text-gray-500"
          }`}
        >
          <Heart className="w-3.5 h-3.5" /> One-Time
        </button>
        <button
          onClick={() => setType("monthly")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            type === "monthly" ? "bg-white shadow text-gray-900" : "text-gray-500"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" /> Monthly
        </button>
      </div>

      {/* Preset Amounts */}
      <div className="grid grid-cols-3 gap-2">
        {PRESET_AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => { setAmount(a); setCustom(""); }}
            className={`py-2 rounded-xl text-sm font-bold border transition-all ${
              amount === a && !custom
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700"
            }`}
          >
            ₹{a.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      {/* Custom Amount */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
        <input
          type="number"
          min={10}
          placeholder="Custom amount"
          value={custom}
          onChange={(e) => { setCustom(e.target.value); }}
          className="w-full border border-gray-200 focus:border-blue-500 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Impact */}
      {impact && !custom && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800">
          {impact}
        </div>
      )}

      {/* Donor Info */}
      <div className="space-y-2.5">
        <input
          type="text"
          placeholder="Your full name *"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className="w-full border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Your email address *"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          className="w-full border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {/* <input
          type="tel"
          placeholder="Mobile number (optional)"
          value={donorPhone}
          onChange={(e) => setDonorPhone(e.target.value)}
          className="w-full border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        /> */}

       <div className="flex gap-2">
  <div className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium flex-shrink-0">
    🇮🇳 +91
  </div>
  <input
    type="tel"
    placeholder="10-digit mobile number"
    value={donorPhone}
    onChange={(e) => {
      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
      setDonorPhone(val);
    }}
    maxLength={10}
    pattern="[6-9][0-9]{9}"
    className="flex-1 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
  />
</div>

        <textarea
          placeholder="Leave a message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {/* CTA */}
      <button
        onClick={handleDonate}
        disabled={loading || finalAmount < 1}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
      >
        {loading
          ? "Processing..."
          : `❤ Donate ₹${finalAmount.toLocaleString("en-IN")}${type === "monthly" ? "/mo" : ""}`}
      </button>

      <p className="text-xs text-center text-gray-400">
        🔒 Secure online payment
      </p>
    </div>
  );
}
