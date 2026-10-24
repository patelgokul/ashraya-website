"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Target, FolderOpen, IndianRupee,
  Users, Mail, BarChart3, LogOut, ExternalLink,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/admin" },
  { icon: Target,          label: "Campaigns",   href: "/admin/campaigns" },
  { icon: FolderOpen,      label: "Projects",    href: "/admin/projects" },
  { icon: IndianRupee,     label: "Donations",   href: "/admin/donations" },
  { icon: Users,           label: "Volunteers",  href: "/admin/volunteers" },
  { icon: Mail,            label: "Subscribers", href: "/admin/subscribers" },
  { icon: BarChart3,       label: "Analytics",   href: "/admin/analytics" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-900 flex flex-col h-screen flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold font-display text-sm">A</span>
          </div>
          <div>
            <div className="text-white font-semibold text-xs leading-tight">Ashraya Admin</div>
            <div className="text-gray-500 text-xs">Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
          <ExternalLink className="w-4 h-4" /> View Site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
