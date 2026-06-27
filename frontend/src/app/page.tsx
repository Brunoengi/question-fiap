"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Question</h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <h2 className="mb-8 text-2xl font-semibold text-gray-900">
          Bem-vindo, {user.name}
        </h2>

        <nav className="flex flex-col gap-4 sm:flex-row flex-wrap justify-center">
          <Link
            href="/aulas"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-8 py-4 text-center font-medium text-white shadow-md transition-all hover:shadow-lg"
          >
            ✨ Aulas com IA
          </Link>
          <Link
            href="/subjects"
            className="rounded-xl bg-white px-8 py-4 text-center font-medium text-gray-900 shadow-md transition-shadow hover:shadow-lg"
          >
            Disciplinas
          </Link>
          <Link
            href="/questions"
            className="rounded-xl bg-white px-8 py-4 text-center font-medium text-gray-900 shadow-md transition-shadow hover:shadow-lg"
          >
            Questões
          </Link>
          <Link
            href="/exams"
            className="rounded-xl bg-white px-8 py-4 text-center font-medium text-gray-900 shadow-md transition-shadow hover:shadow-lg"
          >
            Provas
          </Link>
        </nav>
      </main>
    </div>
  );
}
