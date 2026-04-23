import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deposit received — Counter Cultures",
  robots: { index: false, follow: false },
};

const QuotePaidPage = () => {
  return (
    <main className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[#B87333] flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-['Cormorant',serif] text-3xl font-light text-[#1a1a1a] mb-2">
          Thank you.
        </h1>
        <p className="text-sm text-[#6B6B6B] max-w-sm mx-auto">
          Your deposit has been received. Counter Cultures will confirm your
          order via email within 1 business day and keep you updated on
          delivery timing.
        </p>
        <p className="mt-8 text-[11px] text-[#999]">
          Counter Cultures · Providencia, San Miguel de Allende, Guanajuato, MX
          <br />
          info@countercultures.com.mx · +52-415-154-8375
        </p>
      </div>
    </main>
  );
};

export default QuotePaidPage;
