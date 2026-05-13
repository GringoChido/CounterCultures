"use client";

import { useEffect, useState } from "react";

const WelcomePage = () => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-light tracking-wider text-[#2C2C2C]">
            Counter Cultures
          </h1>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E0DB]">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#16a34a"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-2">
            Welcome!
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            You&apos;re signed in. Redirecting to the shop in {countdown}...
          </p>
        </div>

        <a
          href="/"
          className="inline-block text-sm text-[#B87333] hover:text-[#A0632D] mt-6 transition-colors"
        >
          Go to shop now
        </a>
      </div>
    </div>
  );
};

export default WelcomePage;
