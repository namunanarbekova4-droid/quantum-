"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// "New Decision" nav item redirects to dashboard (where the form lives)
export default function NewDecisionRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard"); }, [router]);
  return null;
}
