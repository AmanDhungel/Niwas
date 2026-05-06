"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, Plus, Wrench, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Home", href: "/", active: pathname === "/" },
    {
      label: "Browse Properties",
      href: "/search",
      active: pathname === "/search",
      badge: "new",
    },
    { label: "For Owners", href: "/owners", active: pathname === "/owners" },
    {
      label: "Dashboard",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    { label: "Support", href: "/support", active: pathname === "/support" },
  ];

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src={"/logo.png"}
              width={1000}
              height={1000}
              alt="logo"
              className="w-full h-5 object-cover"
            />
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuLink
                    href={link.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "relative text-sm font-medium h-9 px-4 rounded-md transition-colors",
                      link.active
                        ? "bg-[#E8540A] text-white hover:bg-[#d14a09] hover:text-white focus:bg-[#E8540A] focus:text-white"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-transparent",
                    )}>
                    {link.label}
                    {link.badge && (
                      <Badge
                        className="ml-1.5 px-1.5 py-0 text-[10px] font-semibold bg-[#E8540A] text-white border-0 absolute -top-1.5 -right-1"
                        variant="default">
                        {link.badge}
                      </Badge>
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-700 font-medium gap-1.5"
              asChild>
              <Link href="/login">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                Login
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-700 font-medium gap-1"
              asChild>
              <Link href="/signup">
                <Plus className="h-3.5 w-3.5" />
                Sign Up
              </Link>
            </Button>

            <Button
              size="sm"
              className="bg-[#E8540A] hover:bg-[#d14a09] text-white font-semibold rounded-full px-5 gap-2 ml-1"
              asChild>
              <Link href="/repair">
                <Wrench className="h-4 w-4" />
                Repair/Maintenance
              </Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu">
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                link.active
                  ? "bg-[#E8540A] text-white"
                  : "text-gray-700 hover:bg-gray-100",
              )}
              onClick={() => setMobileOpen(false)}>
              {link.label}
              {link.badge && (
                <Badge className="text-[10px] px-1.5 py-0 bg-[#E8540A] text-white border-0">
                  {link.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="pt-2 border-t border-gray-100 space-y-1">
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}>
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              Login
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}>
              <Plus className="h-3.5 w-3.5" />
              Sign Up
            </Link>
            <Link
              href="/repair"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm font-semibold bg-[#E8540A] text-white hover:bg-[#d14a09]"
              onClick={() => setMobileOpen(false)}>
              <Wrench className="h-4 w-4" />
              Repair/Maintenance
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
