"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const linkClass = (href: string) =>
    `px-3 py-1 rounded text-sm transition-colors ${
      pathname.startsWith(href)
        ? "bg-white/20 text-white"
        : "text-zinc-300 hover:text-white"
    }`;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900">
        <div className="animate-spin h-8 w-8 border-4 border-zinc-500 border-t-white rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100">
      <nav className="bg-zinc-900 text-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Question
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/aulas" className={linkClass("/aulas")}>
              Aulas IA
            </Link>
            <Link href="/subjects" className={linkClass("/subjects")}>
              Disciplinas
            </Link>
            <Link href="/questions" className={linkClass("/questions")}>
              Questões
            </Link>
            <Link href="/exams" className={linkClass("/exams")}>
              Provas
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-300">{user.name}</span>
          <button
            onClick={logout}
            className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
