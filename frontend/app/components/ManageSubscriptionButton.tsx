"use client";

import { useState } from "react";

interface Props {
  label: string;
  noSubscriptionLabel: string;
  className?: string;
}

export default function ManageSubscriptionButton({
  label,
  noSubscriptionLabel,
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(noSubscriptionLabel);
      }
    } catch (e) {
      console.error("[portal]", e);
      alert(noSubscriptionLabel);
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
      {loading ? "..." : label}
    </button>
  );
}
