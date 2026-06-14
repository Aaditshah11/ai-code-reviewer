'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthSuccess() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        {/* Simple spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
        <h2 className="text-xl font-medium tracking-tight">
          Login successful! Redirecting to dashboard...
        </h2>
      </div>
    </div>
  );
}
