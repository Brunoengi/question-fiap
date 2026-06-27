"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      router.push("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosErr.response?.data?.message || "Erro ao cadastrar"
        );
      } else {
        setError("Erro ao cadastrar");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
        Question
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Nome
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Repita a senha"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Fazer login
        </Link>
      </p>
    </div>
  );
}
