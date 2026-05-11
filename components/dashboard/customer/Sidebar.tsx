"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarCheck2,
  CalendarDays,
  FileText,
  Search,
  ShoppingCart,
  User2,
  Wrench,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Base URL: /dashboard/customer
const navItems = [
  { title: "Profile", icon: User2, url: "/dashboard/customer/profile" },
  { title: "Overview", icon: Activity, url: "/dashboard/customer/overview" },
  {
    title: "Browse Rentals",
    icon: Search,
    url: "/dashboard/customer/browse-rentals",
  },
  {
    title: "Property Tours",
    icon: CalendarDays,
    url: "/dashboard/customer/property-tours",
  },
  {
    title: "Marketplace",
    icon: ShoppingCart,
    url: "/dashboard/customer/marketplace",
  },
  {
    title: "Maintenance",
    icon: Wrench,
    url: "/dashboard/customer/maintenance",
  },
  {
    title: "My Bookings",
    icon: CalendarCheck2,
    url: "/dashboard/customer/my-bookings",
  },
  {
    title: "My Requests",
    icon: FileText,
    url: "/dashboard/customer/my-requests",
  },
];

export function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" className="border-r-0">
      <SidebarHeader className="px-6 py-8">
        <div className="flex items-center gap-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F26522]">
            <span className="text-xl font-bold text-white italic">R</span>
          </div>
          <div className="flex text-2xl font-semibold tracking-tight">
            <span className="text-slate-900">RAM</span>
            <span className="text-[#F26522]">Works</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-slate-400">
            Customer Portal
          </SidebarGroupLabel>

          <SidebarMenu className="mt-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={`
                      flex items-center gap-3 px-3 py-6 text-[15px] transition-colors
                      ${
                        isActive
                          ? "bg-[#E9ECEF] text-slate-900 font-bold hover:bg-[#E9ECEF]"
                          : "text-slate-600 hover:bg-slate-50"
                      }
                    `}>
                    <Link href={item.url}>
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-slate-900" : "text-slate-400"}`}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
