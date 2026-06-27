"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Alternative {
  label: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface Questao {
  id: string;
  statement: string;
  difficulty: string;
  solution: string;
  alternatives: Alternative[];
}

interface ExamQuestion {
  order: number;
  question: Questao;
}

interface Aula {
  id: string;
  title: string;
  content: string | null;
  objectives: string[];
  createdAt: string;
  examQuestions: ExamQuestion[];
}

type Aba = "conteudo" | "questoes";

function badgeDificuldade(d: string) {
  if (d === "EASY") return { label: "Fácil", cls: "bg-green-100 text-green-800" };
  if (d === "HARD") return { label: "Difícil", cls: "bg-red-100 text-red-800" };
  return { label: "Médio", cls: "bg-yellow-100 text-yellow-800" };
}

function renderConteudo(texto: string) {
  return texto.split("\n").map((linha, i) => {
    if (linha.startsWith("## ")) {
      return (
        <h2 key={i} className="text-xl font-bold text-zinc-900 mt-6 mb-3">
          {linha.replace("## ", "")}
        </h2>
      );
    }
    if (linha.startsWith("### ")) {
      return (
        <h3 key={i} className="text-base font-semibold text-zinc-800 mt-4 mb-2">
          {linha.replace("### ", "")}
        </h3>
      );
    }
    if (linha.startsWith("> ")) {
      return (
        <blockquote
          key={i}
          className="border-l-4 border-blue-400 pl-4 py-1 my-3 bg-blue-50 rounded-r-lg"
        >
          <code className="text-blue-700 text-sm">{linha.replace("> ", "")}</code>
        </blockquote>
      );
    }
    if (linha.match(/^\d+\.\s/)) {
      return (
        <p key={i} className="ml-4 text-zinc-600 text-sm my-0.5">
          {linha}
        </p>
      );
    }
    if (linha.startsWith("- ")) {
      return (
        <p key={i} className="ml-4 text-zinc-600 text-sm my-0.5 flex gap-2">
          <span>•</span>
          {linha.replace("- ", "")}
        </p>
      );
    }
    if (linha.startsWith("| ")) {
      return (
        <div key={i} className="overflow-x-auto my-1">
          <table className="text-sm w-full border-collapse">
            <tr>
              {linha
                .split("|")
                .filter((c) => c.trim() && c.trim() !== "---")
                .map((cell, ci) => (
                  <td key={ci} className="border border-zinc-200 px-3 py-1.5 text-zinc-600">
                    {cell.trim()}
                  </td>
                ))}
            </tr>
          </table>
        </div>
      );
    }
    if (!linha.trim()) return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-zinc-600 text-sm leading-relaxed">
        {linha}
      </p>
    );
  });
}

export default function RevisaoAulaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [aula, setAula] = useState<Aula | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>("conteudo");
  const [gabarito, setGabarito] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/exams/${id}`)
      .then(({ data }) => setAula(data))
      .catch(() => router.push("/aulas"))
      .finally(() => setCarregando(false));
  }, [id, router]);

  if (carregando) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (!aula) return null;

  const questoes = [...(aula.examQuestions ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((eq) => eq.question);

  const dif = questoes[0]?.difficulty ?? "MEDIUM";
  const badge = badgeDificuldade(dif);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Link href="/aulas" className="text-zinc-400 hover:text-zinc-600 transition-colors text-sm">
          ← Voltar
        </Link>
        <span className="text-zinc-300">|</span>
        <span className="text-sm font-medium text-zinc-700 truncate max-w-xs">{aula.title}</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => window.print()}
            className="border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            ⬇️ PDF
          </button>
        </div>
      </div>

      {/* Info da aula */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-5 print:border-none">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
          <span className="text-xs text-zinc-400">{questoes.length} questões</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">{aula.title}</h1>

        {aula.objectives?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">
              Objetivos de aprendizagem
            </h3>
            <ul className="space-y-1">
              {aula.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">✓</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-zinc-200 mb-5 print:hidden">
        {(["conteudo", "questoes"] as Aba[]).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              aba === a
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {a === "conteudo" ? "📝 Conteúdo da aula" : "❓ Questões"}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === "conteudo" && (
        <div className="bg-white rounded-xl border border-zinc-200 p-8 print:border-none">
          {aula.content ? (
            <div className="leading-relaxed space-y-1">{renderConteudo(aula.content)}</div>
          ) : (
            <p className="text-zinc-400 text-sm text-center py-8">Conteúdo não disponível</p>
          )}
        </div>
      )}

      {/* Questões */}
      {aba === "questoes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">
              {questoes.length} questões de múltipla escolha
            </span>
            <button
              onClick={() => setGabarito(!gabarito)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                gabarito
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {gabarito ? "✓ Gabarito ativado" : "Ver gabarito"}
            </button>
          </div>

          {questoes.map((q, qi) => {
            const alts = [...(q.alternatives ?? [])].sort(
              (a, b) => a.order - b.order
            );
            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-zinc-200 p-6 print:break-inside-avoid"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {qi + 1}
                  </span>
                  <p className="font-medium text-zinc-900 text-sm">{q.statement}</p>
                </div>
                <div className="space-y-2 ml-10">
                  {alts.map((alt) => (
                    <div
                      key={alt.label}
                      className={`flex items-start gap-3 p-3 rounded-lg text-sm transition-colors ${
                        gabarito && alt.isCorrect
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                          gabarito && alt.isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-zinc-300 text-zinc-500"
                        }`}
                      >
                        {alt.label}
                      </span>
                      {alt.text}
                      {gabarito && alt.isCorrect && (
                        <span className="ml-auto text-green-600 flex-shrink-0">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                {gabarito && q.solution && (
                  <div className="ml-10 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Explicação:</span> {q.solution}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-8 flex items-center justify-between py-6 border-t border-zinc-200 print:hidden">
        <Link
          href="/aulas/nova"
          className="border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          ← Gerar outra aula
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            ⬇️ Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
