"use client";

import { env } from "@/env";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ClerkSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) return;
    if (syncedUserId.current === user.id) return;

    const userId = user.id;
    const payload = {
      clerkId: userId,
      userName:
        user.fullName ??
        [user.firstName, user.lastName].filter(Boolean).join(" "),
      email: user.primaryEmailAddress?.emailAddress ?? null,
      status: "active",
    };

    let isCancelled = false;

    async function syncUser() {
      try {
        await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        syncedUserId.current = userId;
      } catch (err) {
        console.error("Error sending auth sync:", err);
      } finally {
        if (!isCancelled && pathname !== "/dashboard") {
          router.push("/dashboard");
        }
      }
    }

    syncUser();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, user, pathname, router]);

  return null;
}
