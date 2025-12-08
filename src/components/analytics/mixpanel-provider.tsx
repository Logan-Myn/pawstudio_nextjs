"use client";

import { useEffect } from "react";
import { initMixpanel, identifyUser, resetUser } from "@/lib/mixpanel";
import { useAuthStore } from "@/lib/store/auth";

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.name || undefined,
        credits: user.credits,
        role: user.role,
        createdAt: user.createdAt,
      });
    } else if (!isAuthenticated) {
      resetUser();
    }
  }, [isAuthenticated, user]);

  return <>{children}</>;
}
