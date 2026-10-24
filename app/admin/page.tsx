import { prisma } from "@/lib/prisma";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminDonationsChart } from "@/components/admin/AdminDonationsChart";
import { IndianRupee, Target, Users, Mail, TrendingUp, Eye } from "lucide-react";

export default async function AdminDashboardPage() {
  const [
    totalRaised,
    activeCampaigns,
    totalVolunteers,
    totalSubscribers,
    recentDonations,
    topCampaigns,
  ] = await Promise.all([
    prisma.campaignDonation.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.volunteer.count(),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.campaignDonation.findMany({
      where: { status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { campaign: { select: { title: true } } },
    }),
    prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      orderBy: { raisedAmount: "desc" },
      take: 5,
      select: { title: true, raisedAmount: true, goalAmount: true, donorCount: true },
    }),
  ]);

  const formatINR = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  };

  const totalAmount = totalRaised._sum.amount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back — here's what's happening at Ashraya.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatsCard label="Total Raised" value={formatINR(totalAmount)} icon={IndianRupee} color="green" change="+12% this month" />
        <AdminStatsCard label="Active Campaigns" value={String(activeCampaigns)} icon={Target} color="blue" />
        <AdminStatsCard label="Volunteers" value={String(totalVolunteers)} icon={Users} color="purple" />
        <AdminStatsCard label="Subscribers" value={String(totalSubscribers)} icon={Mail} color="amber" />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AdminDonationsChart />
        </div>

        {/* Top Campaigns */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Top Campaigns
          </h3>
          <div className="space-y-3">
            {topCampaigns.map((c) => {
              const pct = Math.round((c.raisedAmount / c.goalAmount) * 100);
              return (
                <div key={c.title}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium truncate max-w-[160px]">{c.title}</span>
                    <span className="text-gray-400 flex-shrink-0">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatINR(c.raisedAmount)} · {c.donorCount} donors</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent Donations</h3>
          <a href="/admin/donations" className="text-xs text-blue-600 font-medium hover:underline">View all</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Donor","Campaign","Amount","Status","Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentDonations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{d.isAnonymous ? "Anonymous" : d.donorName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{d.campaign.title}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600">{formatINR(d.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${d.status === "SUCCESS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
