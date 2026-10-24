import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { amount, campaignId, donorName, donorEmail, donorPhone, message } = await req.json();

    if (!amount || amount < 10 || !campaignId || !donorName || !donorEmail) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Create Razorpay order
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: "INR",
      receipt:  `ashraya_${Date.now()}`,
      notes:    { campaignId, donorName, donorEmail },
    });

    const donation = await prisma.campaignDonation.create({
      data: {
        campaignId,
        donorName,
        donorEmail,
        donorPhone: donorPhone || null,
        message:    message    || null,
        amount,
        orderId:       order.id,
        paymentMethod: "RAZORPAY",
        status:        "PENDING",
      },
    });

    return NextResponse.json({ orderId: order.id, donationId: donation.id });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
