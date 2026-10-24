import Link from "next/link";
import { XCircle, RefreshCw, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
          <p className="text-gray-600 mb-2">Your payment could not be processed.</p>
          <p className="text-sm text-gray-500 mb-8">
            No amount has been deducted. Please try again or contact us if the issue persists.
          </p>
          <div className="space-y-3">
            <Link href="/donate" className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-sm">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Link>
            <a href={SITE.contact.phoneHref} className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-3 text-sm">
              <Phone className="w-4 h-4" /> Call {SITE.contact.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
