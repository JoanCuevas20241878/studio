"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only perform redirection once the loading state is resolved.
    if (!loading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Render a loading state while the authentication check and redirection are in progress.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-12 w-12" />
    </div>
  );
}
