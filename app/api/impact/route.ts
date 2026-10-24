import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [metrics, totalRaised, totalDonors, activeCampaigns, completedCampaigns, totalVolunteers] = await Promise.all([
    prisma.impactMetric.findMany(),
    prisma.campaignDonation.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.campaignDonation.groupBy({ by: ["donorEmail"], where: { status: "SUCCESS" }, _count: true }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.campaign.count({ where: { status: "COMPLETED" } }),
    prisma.volunteer.count({ where: { status: "ACTIVE" } }),
  ]);

  return NextResponse.json({
    metrics,
    summary: {
      totalRaised:        totalRaised._sum.amount || 0,
      uniqueDonors:       totalDonors.length,
      activeCampaigns,
      completedCampaigns,
      totalVolunteers,
    },
  });
}
