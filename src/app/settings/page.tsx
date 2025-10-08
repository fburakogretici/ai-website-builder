"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Ayarlar ana sayfası açıldığında otomatik olarak profile'a yönlendir
    router.replace("/settings/profile");
  }, [router]);

  return null;
}
