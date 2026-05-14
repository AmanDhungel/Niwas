"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { CustomerSidebar } from "./dashboard/customer/Sidebar";
import { SidebarProvider } from "./ui/sidebar";
import { useVerifyToken } from "@/services/auth";
import useAuthStore from "@/context/User";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function DynamicLayoutContent({ children }: any) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  const { mutate } = useVerifyToken();
  const { setUser, logout } = useAuthStore();
  // const router = useRouter();

  useEffect(() => {
    mutate(
      { id: 1234 },
      {
        onSuccess: (val) => {
          setUser(val?.user as any);
        },
        onError: () => {
          setUser(null);
          logout();
          // router.push("/");
        },
      },
    );
  }, [pathname]);

  if (!isDashboard) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <CustomerSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
