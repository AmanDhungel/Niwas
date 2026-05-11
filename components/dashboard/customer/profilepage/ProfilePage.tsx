"use client";

import React from "react";
import {
  Heart,
  Calendar,
  Award,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  Home,
  CheckCircle2,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  return (
    <div className="w-full min-h-screen bg-white p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-500">
                Profile
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* --- Profile & Settings Section Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Profile & Settings
          </h2>
          <p className="text-sm text-slate-500">
            Manage your account information
          </p>
        </div>
        <Button className="bg-[#F26522] hover:bg-[#d95a1e] text-white gap-2 px-6">
          <Settings className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* --- Main Profile Info Card --- */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 border-none">
              <AvatarFallback className="bg-[#F26522] text-white text-3xl font-bold">
                GU
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Guest User
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-medium py-0 px-2 h-5">
                    Unverified
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  Guest Account • Member since 2025-01-28
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-4 w-4 text-slate-400" />
                  guest@example.com
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Phone className="h-4 w-4 text-slate-400" />
                  +1 234 567 8900
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Saved Properties",
            value: "12",
            icon: Heart,
            color: "text-pink-500",
          },
          {
            label: "Tour Requests",
            value: "3",
            icon: Calendar,
            color: "text-blue-500",
          },
          {
            label: "Reward Points",
            value: "150",
            icon: Award,
            color: "text-orange-500",
          },
        ].map((stat, idx) => (
          <Card key={idx} className="border-slate-200 shadow-none">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
              <div className="text-3xl font-bold text-slate-900">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- Verification Banner --- */}
      <Card className="bg-[#FFF1EB] border-[#FFD8C9] shadow-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="bg-[#F26522] p-2 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h4 className="font-bold text-slate-900">Verify Your Account</h4>
            <p className="text-sm text-slate-600">
              Get verified to unlock premium features, faster bookings, and
              exclusive offers
            </p>
            <div className="pt-3">
              <Button className="bg-[#F26522] hover:bg-[#d95a1e] text-white gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Start Verification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
