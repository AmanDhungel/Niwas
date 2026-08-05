"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForgotPassword } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { Dialog, DialogContent } from "../ui/dialog";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  user_email: z.email().min(1, "Please enter a valid email"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordDialog() {
  const { mutate, isPending } = useForgotPassword();
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const open = params.get("tab") === "forgot_password";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      user_email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    mutate(data, {
      onSuccess: () => {
        setSent(true);
        toast.success("Password reset instructions sent to your email.");
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
          router.push("/?tab=forgot_password");
        } else {
          setSent(false);
          reset();
          router.push("/");
        }
      }}>
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
              Remembered your password?{" "}
              <Link
                href={"/?tab=login"}
                className="text-orange-600 font-semibold cursor-pointer hover:underline underline-offset-4">
                Sign in
              </Link>
            </motion.p>
          </div>

          {sent ? (
            <motion.div
              variants={itemVariants}
              className="text-center space-y-4">
              <p className="text-slate-600 text-sm">
                If an account exists for that email, we&apos;ve sent
                instructions to reset your password. Please check your inbox.
              </p>
              <Button
                type="button"
                onClick={() => router.push("/?tab=login")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98]">
                Back to Login
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.p
                variants={itemVariants}
                className="text-slate-500 text-sm -mt-2 mb-2">
                Enter the email associated with your account and we&apos;ll
                send you a link to reset your password.
              </motion.p>

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
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98] flex justify-center items-center">
                  {isPending ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </motion.div>
            </form>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
