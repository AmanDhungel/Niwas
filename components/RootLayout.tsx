"use client";

import dynamic from "next/dynamic";
import TanStackProvider from "./TanStackProvider";
import { LoadingBar } from "./Progress";
import { Toaster } from "./ui/sonner";

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
