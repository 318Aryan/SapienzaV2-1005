"use server";

import { auth, clerkClient } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import type { Role } from "@/lib/roles";

export const setRole = async (role: Role) => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });
  } catch (error) {
    // ClerkAPIResponseError's own .message is just the HTTP status text
    // ("Unprocessable Entity"), which is all the Next.js error overlay was
    // showing. The actual field-level reason lives in .errors — rethrow with
    // that folded into the message so it's visible without terminal access.
    if (error && typeof error === "object" && "errors" in error) {
      const clerkErrors = (error as {
        errors: { message?: string; longMessage?: string; meta?: { paramName?: string } }[];
      }).errors;
      const detail = clerkErrors
        ?.map((e) => `[${e.meta?.paramName ?? "?"}] ${e.longMessage ?? e.message}`)
        .join("; ");
      console.error("Clerk updateUser failed:", JSON.stringify(clerkErrors, null, 2));
      throw new Error(`Clerk rejected the role update — ${detail}`);
    }
    console.error("Clerk updateUser failed:", error);
    throw error;
  }

  redirect(role === "teacher" ? "/teacher/overview" : "/join-class");
};
