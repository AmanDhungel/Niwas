"use client";
import TanStackProvider from "./TanStackProvider";
import { LoadingBar } from "./Progress";
import { Toaster } from "./ui/sonner";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { CustomerSidebar } from "./dashboard/customer/Sidebar";
import { SidebarProvider } from "./ui/sidebar";

const RootLayoutProvider = ({ children }: any) => {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <TanStackProvider>
      <SidebarProvider>
        <div className={`${isDashboard ? "flex w-full" : ""}`}>
          {!isDashboard ? <Navbar /> : <CustomerSidebar />}
          {children}
        </div>
      </SidebarProvider>
      <LoadingBar />
      <Toaster />
    </TanStackProvider>
  );
};

export default RootLayoutProvider;
