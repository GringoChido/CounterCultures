"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

const SignOutPage = () => {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-3xl font-light tracking-wider text-[#2C2C2C]">
          Counter Cultures
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-4">Signing out...</p>
      </div>
    </div>
  );
};

export default SignOutPage;
