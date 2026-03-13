"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type CheckoutPlan = "starter" | "pro";

interface Props {
  plan: CheckoutPlan;
  isLoggedIn: boolean;
  className?: string;
  children: ReactNode;
}

export default function CheckoutButton({
  plan,
  isLoggedIn,
  className,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("[checkout]", data.error);
      }
    } catch (e) {
      console.error("[checkout]", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "..." : children}
    </button>
  );
}
