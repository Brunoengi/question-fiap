import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Question | Login",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <Link href="/inicio" className="text-xl font-bold text-gray-900">
            Question
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
