"use client";

import dynamic from "next/dynamic";
import TanStackProvider from "./TanStackProvider";
import { LoadingBar } from "./Progress";
import { Toaster } from "./ui/sonner";
import { useVerifyToken } from "@/services/auth";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import useAuthStore from "@/context/User";
import { useRouter } from "next/router";

const DynamicLayout = dynamic(() => import("./DynamicLayoutContent"), {
  ssr: false,
});

const RootLayoutProvider = ({ children }: any) => {
  return (
    <TanStackProvider>
      <DynamicLayout>{children}</DynamicLayout>
      <LoadingBar />
      <Toaster />
    </TanStackProvider>
  );
};

export default RootLayoutProvider;
