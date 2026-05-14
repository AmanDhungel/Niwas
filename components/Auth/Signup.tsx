"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { useSignup } from "@/services/auth";
import { Loader2, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";

export const signupSchema = z.object({
  user_name: z.string().min(2, "Name must be at least 2 characters"),
  user_email: z.string().email("Invalid email address"),
  user_password: z.string().min(8, "Password must be at least 8 characters"),
  ecommerce_user_type: z.enum(["customer", "vendor"]),
});

export type SignupPayload = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { mutate, isPending } = useSignup();
  const params = useSearchParams();
  const router = useRouter();
  const open = params.get("tab") === "signup";

  const form = useForm<SignupPayload>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      user_name: "",
      user_email: "",
      user_password: "",
      ecommerce_user_type: "customer",
    },
  });
  const onSubmit = (data: SignupPayload) => {
    mutate(data, {
      onSuccess: () => {
        toast.success("Account created successfully!");
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
          router.push("/?tab=signup");
        } else {
          router.push("/");
        }
      }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-700 font-medium gap-1">
          <Plus className="h-3.5 w-3.5" />
          Sign Up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white p-8 mt-5 rounded-2xl shadow-xl shadow-orange-200/20 border border-orange-100 max-w-md  relative z-10">
          <div className="text-center mb-8">
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-black text-slate-800 tracking-tight">
              RAM<span className="text-orange-500">Works</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-slate-500 mt-2 text-sm">
              Already have an account?{" "}
              <Link
                href={"/?tab=login"}
                className="text-orange-600 font-semibold cursor-pointer hover:underline underline-offset-4">
                Signin
              </Link>
            </motion.p>
          </div>
        </motion.div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98] flex justify-center items-center">
                {isPending ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Singup"
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
