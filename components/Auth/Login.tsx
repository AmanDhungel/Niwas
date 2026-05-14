"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useLogin } from "@/services/auth";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/context/User";
import { motion, Variants } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogTrigger } from "../ui/dialog";
import { toast } from "sonner";

const loginSchema = z.object({
  user_email: z.email().min(1, "Please enter a valid email"),
  user_password: z.string().min(1, "Password is required"),
  fullName: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { mutate, isPending } = useLogin();
  const [seePassword, setSeePassword] = useState(false);
  const { loginData } = useAuthStore();
  const router = useRouter();
  const params = useSearchParams();

  const open = params.get("tab") === "login";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user_email: "",
      user_password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    mutate(data, {
      onSuccess: (response: any) => {
        const userData = response?.user;
        if (userData) {
          loginData(userData);
          router.push("/dashboard/customer/overview");
        } else {
          console.error("User data not found in response structure:", response);
          toast.error("Failed to sync user session.");
        }
      },
      onError: (error: any) => {
        let errorMessage = "An unexpected error occurred";

        try {
          if (
            typeof error.message === "string" &&
            error.message.startsWith("{")
          ) {
            const parsed = JSON.parse(error.message);
            errorMessage = parsed.message || errorMessage;
          } else {
            errorMessage = error.message || errorMessage;
          }
        } catch (e) {
          errorMessage = error.message || errorMessage;
        }

        toast.error(errorMessage);
      },
    });
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (val) {
          router.push("/?tab=login");
        } else {
          router.push("/");
        }
      }}>
      <DialogTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-700 font-medium gap-1.5">
          <Lock className="h-3.5 w-3.5 text-gray-400" />
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg!">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white p-8 rounded-2xl shadow-xl shadow-orange-200/20 border border-orange-100 max-w-md  relative z-10">
          <div className="text-center mb-8">
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-black text-slate-800 tracking-tight">
              RAM<span className="text-orange-500">Works</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-slate-500 mt-2 text-sm">
              Don`t have an account?{" "}
              <Link
                href={"/?tab=signup"}
                className="text-orange-600 font-semibold cursor-pointer hover:underline underline-offset-4">
                Get Started!
              </Link>
            </motion.p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Your Email
              </label>
              <input
                {...register("user_email")}
                type="email"
                placeholder="Enter your email address"
                className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50 ${
                  errors.user_email ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.user_email && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.user_email.message}
                </p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="block text-sm font-bold text-slate-700 flex justify-between  mb-1">
                Your Password
                <button
                  type="button"
                  onClick={() => setSeePassword(!seePassword)}
                  className="text-slate-400 hover:text-orange-500 transition-colors">
                  {seePassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div
                className={`flex items-center w-full bg-blue-100/70 border rounded-xl px-3 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all ${
                  errors.user_password ? "border-red-500" : "border-slate-200"
                }`}>
                <Input
                  {...register("user_password")}
                  type={seePassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="focus-visible:ring-0 border-none rounded-none shadow-none bg-transparent! p-1 h-11 text-slate-900"
                />
              </div>
              {errors.user_password && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.user_password.message}
                </p>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-500"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-medium text-slate-600 cursor-pointer">
                Remember Me
              </label>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98] flex justify-center items-center">
                {isPending ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Login"
                )}
              </Button>
            </motion.div>

            {/* <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="mx-4 text-slate-400 text-xs font-medium uppercase">
              Or continue with
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            className="w-full border border-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
            <span className="text-sm font-bold text-slate-700">
              Login with Google
            </span>
          </motion.button> */}
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
