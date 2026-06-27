import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Question | Login",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      {children}
    </div>
  );
}
