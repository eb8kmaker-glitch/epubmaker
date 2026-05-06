"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import UserMenu from "@/app/components/UserMenu";

interface Props {
  locale: string;
}

export default function NavbarUserClient({ locale }: Props) {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? "" });
    });
  }, []);

  return <UserMenu user={user} locale={locale} />;
}
