import { icons } from "@/assets/icons/exports";
import { Search, Circle, Languages } from "lucide-react";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import AvatarDropdown from "../Auth/Profile";
import { useVerifyToken } from "@/services/auth";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/context/User";

type TopBarProps = {
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarCollapsed?: boolean;
};

const TopBar: React.FC<TopBarProps> = ({
  setSidebarCollapsed,
  sidebarCollapsed,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setUser, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const handleSearchClick = (): void => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const handleSearchBlur = (): void => {
    if (!searchInputRef.current?.value) {
      setIsSearchOpen(false);
    }
  };

  const { mutate } = useVerifyToken();
  const pathname = usePathname();

  useEffect(() => {
    mutate(
      { id: 1234 },
      {
        onSuccess: (val) => {
          setIsOnline(true);
          setUser(val?.user as any);
        },
        onError: () => {
          setIsOnline(false);
          setUser(null);
          logout();
          router.push("/");
        },
      },
    );
  }, [pathname]);

  return (
    <div className="w-full bg-white border-b border-gray-200 px-4 py-3 sm:pl-0 md:pl-2 -ml-[20px] max-md:ml-0 max-lg:-ml-[17px] ">
      <div className="flex items-center justify-between">
        <div className="flex items-center shrink-0">
          <button
            className={`p-2  rounded-lg hover:bg-gray-100 transform transition-transform duration-200 ease-in-out ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
            onClick={() => setSidebarCollapsed((s) => !s)}
            aria-label="Close door">
            <Image
              src={icons.DoorExit}
              alt="Close Door Icon"
              className={`w-5 cursor-pointer object-cover`}
            />
          </button>
          <div className="flex-1 flex justify-center max-w-2xl mx-4  max-md:hidden">
            <div className="relative w-full max-w-md">
              {!isSearchOpen ? (
                <button
                  onClick={handleSearchClick}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-slate-200 rounded-lg text-gray-500 hover:bg-slate-300 transition-colors"
                  aria-label="Open search">
                  <Search size={16} />
                  <span className="text-sm">Search...</span>
                  <div className="ml-auto flex items-center gap-1 text-xs">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-500">
                      Ctrl
                    </kbd>
                    <span className="text-gray-400">+</span>
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-500">
                      /
                    </kbd>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-200 rounded-lg border-2 border-transparent focus:border-blue-500 focus:outline-none focus:bg-white transition-all"
                    onBlur={handleSearchBlur}
                    aria-label="Search input"
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Close search">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">
                      Esc
                    </kbd>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Grip">
            <Image src={icons.FourDots} alt="Grip Icon" className="w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 ">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="More options">
            <Image src={icons.ZoomInOut} alt="Grip Icon" className="w-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="More options">
            <Languages size={16} className="text-slate-500" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notifications">
            <Image src={icons.Message} alt="Grip Icon" className="w-5" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Messages">
            <Image src={icons.MailIcon} alt="Grip Icon" className="w-5" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Settings">
            <Image src={icons.Notification} alt="Grip Icon" className="w-5" />
          </button>

          <div className="relative ml-2 max-md:ml-0">
            <AvatarDropdown />
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
              aria-label={isOnline ? "Online" : "Offline"}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
