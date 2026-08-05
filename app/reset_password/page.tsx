"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { useResetPassword } from "@/services/auth";

const resetPasswordSchema = z
  .object({
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { mutate, isPending } = useResetPassword();
  const [seePassword, setSeePassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const token = params.get("token");
  const user_email = params.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!token || !user_email) {
      toast.error("This password reset link is invalid.");
      return;
    }

    mutate(
      { ...data, token, user_email },
      {
        onSuccess: () => {
          setSuccess(true);
          toast.success("Password reset successfully.");
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
      },
    );
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

  if (!token || !user_email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-orange-200/20 border border-orange-100 max-w-md w-full text-center">
          <h1 className="text-2xl font-black text-slate-800 mb-2">
            Invalid Link
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            This password reset link is missing required information. Please
            request a new one.
          </p>
          <Link href="/?tab=forgot_password">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98]">
              Request New Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white p-8 rounded-2xl shadow-xl shadow-orange-200/20 border border-orange-100 max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <motion.h1
            variants={itemVariants}
            className="text-3xl font-black text-slate-800 tracking-tight">
            RAM<span className="text-orange-500">Works</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-slate-500 mt-2 text-sm">
            {success
              ? "Your password has been updated"
              : "Choose a new password"}
          </motion.p>
        </div>

        {success ? (
          <motion.div
            variants={itemVariants}
            className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-slate-600 text-sm">
              You can now sign in with your new password.
            </p>
            <Button
              onClick={() => router.push("/?tab=login")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98]">
              Back to Login
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-slate-700">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setSeePassword(!seePassword)}
                  className="text-slate-400 hover:text-orange-500 transition-colors">
                  {seePassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              <Input
                {...register("new_password")}
                type={seePassword ? "text" : "password"}
                placeholder="Enter new password"
                className={`bg-slate-50 border rounded-xl h-11 px-3 ${
                  errors.new_password ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.new_password.message}
                </p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <Input
                {...register("confirm_password")}
                type={seePassword ? "text" : "password"}
                placeholder="Re-enter new password"
                className={`bg-slate-50 border rounded-xl h-11 px-3 ${
                  errors.confirm_password
                    ? "border-red-500"
                    : "border-slate-200"
                }`}
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.confirm_password.message}
                </p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98] flex justify-center items-center">
                {isPending ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </motion.div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
