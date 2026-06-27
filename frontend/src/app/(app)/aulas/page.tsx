"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface ExamQuestion {
  order: number;
  question: { difficulty: string };
}

interface Aula {
  id: string;
  title: string;
  content: string | null;
  objectives: string[];
  createdAt: string;
  examQuestions: ExamQuestion[];
}

type Filtro = "todos" | "EASY" | "MEDIUM" | "HARD";

function badgeDificuldade(d: string) {
  if (d === "EASY") return { label: "Fácil", cls: "bg-green-100 text-green-800" };
  if (d === "HARD") return { label: "Difícil", cls: "bg-red-100 text-red-800" };
  return { label: "Médio", cls: "bg-yellow-100 text-yellow-800" };
}

function inferirDificuldade(aula: Aula): string {
  return aula.examQuestions?.[0]?.question?.difficulty ?? "MEDIUM";
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AulasPage() {
  const router = useRouter();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useEffect(() => {
    api
      .get("/exams")
      .then(({ data }) => {
        const comConteudo = (data as Aula[]).filter((e) => e.content);
        setAulas(comConteudo);
      })
      .catch(() => router.push("/login"))
      .finally(() => setCarregando(false));
  }, [router]);

  const filtradas = aulas.filter((a) => {
    const dif = inferirDificuldade(a);
    const passaFiltro = filtro === "todos" || dif === filtro;
    const passaBusca = a.title.toLowerCase().includes(busca.toLowerCase());
    return passaFiltro && passaBusca;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Aulas geradas por IA</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {aulas.length} aula{aulas.length !== 1 ? "s" : ""} gerada{aulas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/aulas/nova"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nova aula
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por tema..."
          className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {(["todos", "EASY", "MEDIUM", "HARD"] as Filtro[]).map((d) => (
            <button
              key={d}
              onClick={() => setFiltro(d)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === d
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {d === "todos" ? "Todos" : d === "EASY" ? "Fácil" : d === "MEDIUM" ? "Médio" : "Difícil"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-blue-600 rounded-full" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg font-medium mb-1">
            {aulas.length === 0 ? "Nenhuma aula gerada ainda" : "Nenhuma aula encontrada"}
          </p>
          <p className="text-sm">
            {aulas.length === 0
              ? "Clique em \"+ Nova aula\" para gerar sua primeira aula com IA"
              : "Tente outro filtro ou gere uma nova aula"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtradas.map((aula) => {
            const dif = inferirDificuldade(aula);
            const badge = badgeDificuldade(dif);
            return (
              <Link
                key={aula.id}
                href={`/aulas/${aula.id}`}
                className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-zinc-400">{formatarData(aula.createdAt)}</span>
                    </div>
                    <h2 className="font-semibold text-zinc-900 text-base group-hover:text-blue-600 transition-colors truncate">
                      {aula.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-zinc-500">
                      <span>{aula.examQuestions?.length ?? 0} questões</span>
                      {aula.objectives?.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{aula.objectives.length} objetivos</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-zinc-300 group-hover:text-blue-400 transition-colors text-lg flex-shrink-0">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
