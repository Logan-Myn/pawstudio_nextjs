"use client";

import { useEffect, useRef } from "react";
import { initMixpanel, identifyUser, resetUser } from "@/lib/mixpanel";
import { useAuthStore } from "@/lib/store/auth";

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      // User is logged in
      if (previousUserId.current !== user.id) {
        identifyUser(user.id, {
          email: user.email,
          name: user.fullName || undefined,
          credits: user.credits,
          role: user.role,
          createdAt: user.createdAt,
        });
        previousUserId.current = user.id;
      }
    } else if (previousUserId.current !== null) {
      // User logged out
      resetUser();
      previousUserId.current = null;
    }
  }, [user]);

  return <>{children}</>;
}
