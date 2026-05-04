"use client";
import TanStackProvider from "./TanStackProvider";
import { LoadingBar } from "./Progress";
import { Toaster } from "./ui/sonner";
import { usePathname } from "next/navigation";

const RootLayoutProvider = ({ children }: any) => {
  const pathname = usePathname();
  return (
    <TanStackProvider>
      {children}
      <LoadingBar />
      <Toaster />
    </TanStackProvider>
  );
};

export default RootLayoutProvider;
