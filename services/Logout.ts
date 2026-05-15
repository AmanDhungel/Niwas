"use server";

import { cookies } from "next/headers";

export async function logoutAction() {
  const c = await cookies();

  c.set("user_token", "", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 0,
  });

  return { success: true };
}
