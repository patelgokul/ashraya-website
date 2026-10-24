import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDonationReceipt } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = await req.json();

    // Verify signature
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const donation = await prisma.campaignDonation.update({
      where: { id: donationId },
      data: { status: "SUCCESS", paymentId: razorpay_payment_id },
    });

    await prisma.campaign.update({
      where: { id: donation.campaignId },
      data: {
        raisedAmount: { increment: donation.amount },
        donorCount:   { increment: 1 },
      },
    });

    const campaign = await prisma.campaign.findUnique({
      where: { id: donation.campaignId },
      select: { title: true },
    });

    // Send receipt (fire-and-forget)
    sendDonationReceipt({
      donorName:     donation.donorName,
      donorEmail:    donation.donorEmail,
      amount:        donation.amount,
      campaignTitle: campaign?.title || "Ashraya Donation",
      paymentId:     razorpay_payment_id,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
