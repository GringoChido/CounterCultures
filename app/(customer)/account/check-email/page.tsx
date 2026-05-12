const CheckEmailPage = () => (
  <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
    <div className="w-full max-w-md text-center">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-light tracking-wider text-[#2C2C2C]">
          Counter Cultures
        </h1>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E0DB]">
        <div className="w-12 h-12 bg-[#B87333]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#B87333"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#2C2C2C] mb-2">
          Check your email
        </h2>
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          We sent you a sign-in link. Click the link in the email to access your
          account. The link expires in 24 hours.
        </p>
      </div>

      <a
        href="/account/sign-in"
        className="inline-block text-sm text-[#B87333] hover:text-[#A0632D] mt-6 transition-colors"
      >
        Back to sign in
      </a>
    </div>
  </div>
);

export default CheckEmailPage;
