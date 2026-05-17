"use client";
import { User, Settings, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useAuthStore from "@/context/User";
import { logoutAction } from "@/services/Logout";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Cookies from "js-cookie";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

const AvatarDropdown = () => {
  const { user, logout } = useAuthStore();

  const userInitials = user?.user_email
    .split(" ")
    .map((n: any) => n[0])
    .join("")
    .toUpperCase();

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutAction();
      logout();
      router.refresh();
      router.replace("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center space-x-2 rounded-full p-1 pl-3 text-gray-700  transition-colors duration-150 "
          aria-haspopup="true">
          <Avatar className="h-9 w-9 ring-2 ring-gray-100">
            <AvatarFallback className="bg-orange-600 text-white ">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Button
              className="p-0"
              variant={"ghost"}
              onClick={() => router.push("/dashboard/customer/profile-page")}>
              <User /> Profile
            </Button>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="bg-red-400/10 text-red-400 "
            onClick={() => handleLogout()}>
            <LogOut className="text-red-400 hover:text-slate-400" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarDropdown;
