"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setTimeout(() => setProgress(100), 0);
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const startLoading = () => {
      setLoading(true);
      setProgress(10);
    };

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin)
      ) {
        const url = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        const isHashScroll =
          url.hash !== "" && url.pathname === currentUrl.pathname;
        const isSamePage = url.href === currentUrl.href;

        if (!isHashScroll && !isSamePage && !anchor.target) {
          startLoading();
        }
      }
    };

    window.addEventListener("click", handleAnchorClick);
    window.addEventListener("app-navigation-start", startLoading);

    return () => {
      window.removeEventListener("click", handleAnchorClick);
      window.removeEventListener("app-navigation-start", startLoading);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <Progress
        value={progress}
        className={`h-1 w-full ${progress === 100 ? "opacity-0" : ""} rounded-none bg-transparent [&>div]:bg-orange-500 transition-all duration-300`}
      />
    </div>
  );
}
