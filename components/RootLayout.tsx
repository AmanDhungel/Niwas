"use client";
import TanStackProvider from "./TanStackProvider";
import { LoadingBar } from "./Progress";
import { Toaster } from "./ui/sonner";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const RootLayoutProvider = ({ children }: any) => {
  return (
    <TanStackProvider>
      <Navbar />
      {children}
      <LoadingBar />
      <Toaster />
    </TanStackProvider>
  );
};

export default RootLayoutProvider;
