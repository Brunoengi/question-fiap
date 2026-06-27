"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Dificuldade = "facil" | "medio" | "dificil";

const quantidades = [5, 10, 15, 20];

const opcoesDificuldade: { valor: Dificuldade; label: string; desc: string }[] =
  [
    { valor: "facil", label: "Fácil", desc: "Conceitos básicos, questões diretas" },
    { valor: "medio", label: "Médio", desc: "Interpretação e aplicação" },
    { valor: "dificil", label: "Difícil", desc: "Análise crítica e resolução complexa" },
  ];

const sugestoes = [
  "Fotossíntese e respiração celular",
  "Revolução Industrial",
  "Equações do 2º Grau",
  "Clima e vegetação do Brasil",
];

export default function NovaAulaPage() {
  const router = useRouter();
  const [tema, setTema] = useState("");
  const [quantidade, setQuantidade] = useState(10);
  const [dificuldade, setDificuldade] = useState<Dificuldade>("medio");
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState("");
  const [erro, setErro] = useState("");

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault();
    if (!tema.trim()) return;
    setGerando(true);
    setErro("");
    setProgresso("Conectando com a IA...");

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    try {
      const response = await fetch(`${API_URL}/lessons/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tema: tema.trim(),
          quantidadeQuestoes: quantidade,
          dificuldade,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ${response.status}: ${text}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let examId: string | null = null;

      setProgresso("Gerando conteúdo da aula...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.done && parsed.examId) {
              examId = parsed.examId;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // tokens de texto da IA — mantém o indicador de progresso
          }
        }
      }

      if (examId) {
        router.push(`/aulas/${examId}`);
      } else {
        throw new Error("Não foi possível salvar a aula gerada");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar aula";
      setErro(msg);
      setGerando(false);
      setProgresso("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/aulas" className="text-zinc-400 hover:text-zinc-600 transition-colors text-sm">
          ← Voltar
        </Link>
        <span className="text-zinc-300">|</span>
        <h1 className="text-xl font-bold text-zinc-900">Gerar nova aula</h1>
      </div>

      <p className="text-sm text-zinc-500 mb-8">
        Preencha as informações abaixo e a IA cria o conteúdo completo com questões.
      </p>

      <form onSubmit={handleGerar} className="space-y-5">
        {/* Tema */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <label className="block text-sm font-semibold text-zinc-900 mb-1">
            Tema da aula <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-zinc-400 mb-3">Seja específico para melhores resultados</p>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: Fotossíntese e respiração celular no Ensino Médio"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            required
            disabled={gerando}
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                disabled={gerando}
                onClick={() => setTema(s)}
                className="text-xs bg-zinc-100 hover:bg-blue-50 hover:text-blue-600 text-zinc-600 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Quantidade */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <label className="block text-sm font-semibold text-zinc-900 mb-1">
            Quantidade de questões
          </label>
          <p className="text-xs text-zinc-400 mb-4">Questões de múltipla escolha geradas pela IA</p>
          <div className="grid grid-cols-4 gap-3">
            {quantidades.map((q) => (
              <button
                key={q}
                type="button"
                disabled={gerando}
                onClick={() => setQuantidade(q)}
                className={`py-3 rounded-lg border-2 font-semibold text-lg transition-colors disabled:opacity-50 ${
                  quantidade === q
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Dificuldade */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <label className="block text-sm font-semibold text-zinc-900 mb-1">
            Nível de dificuldade
          </label>
          <p className="text-xs text-zinc-400 mb-4">Aplica-se ao conteúdo e às questões</p>
          <div className="grid gap-3">
            {opcoesDificuldade.map((op) => (
              <button
                key={op.valor}
                type="button"
                disabled={gerando}
                onClick={() => setDificuldade(op.valor)}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors text-left disabled:opacity-50 ${
                  dificuldade === op.valor
                    ? "border-blue-600 bg-blue-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    dificuldade === op.valor
                      ? "border-blue-600 bg-blue-600"
                      : "border-zinc-300"
                  }`}
                >
                  {dificuldade === op.valor && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <div className={`font-medium text-sm ${dificuldade === op.valor ? "text-blue-700" : "text-zinc-900"}`}>
                    {op.label}
                  </div>
                  <div className="text-xs text-zinc-400">{op.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        {/* Ação */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="text-sm text-blue-700">
            {gerando ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                {progresso}
              </span>
            ) : (
              <>
                <span className="font-semibold">Resumo:</span> aula de{" "}
                <span className="font-semibold">"{tema || "..."}"</span> com{" "}
                <span className="font-semibold">{quantidade} questões</span> no nível{" "}
                <span className="font-semibold">{dificuldade}</span>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={!tema.trim() || gerando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex-shrink-0"
          >
            {gerando ? "Gerando..." : "Gerar aula →"}
          </button>
        </div>
      </form>
    </div>
  );
}
