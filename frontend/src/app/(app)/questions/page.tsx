"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Topic {
  id: number;
  name: string;
  subjectId: number;
}

interface Question {
  id: number;
  statement: string;
  subjectId: number;
  topicId: number;
  type: string;
  difficulty: string;
  status: string;
  createdAt: string;
  topic?: Topic;
  source?: string;
}

interface Subject {
  id: number;
  name: string;
  topics: Topic[];
}

const DIFFICULTY_MAP: Record<string, string> = {
  FACIL: "Fácil",
  MEDIO: "Médio",
  DIFICIL: "Difícil",
};

const TYPE_MAP: Record<string, string> = {
  MULTIPLA_ESCOLHA: "Múltipla Escolha",
  DESCRITIVA: "Descritiva",
};

const STATUS_MAP: Record<string, string> = {
  RASCUNHO: "Rascunho",
  REVISAO: "Revisão",
  APROVADA: "Aprovada",
};

function badgeColor(val: string) {
  if (val === "FACIL" || val === "RASCUNHO") return "bg-zinc-100 text-zinc-700";
  if (val === "MEDIO" || val === "REVISAO") return "bg-yellow-100 text-yellow-700";
  if (val === "DIFICIL") return "bg-red-100 text-red-700";
  if (val === "APROVADA") return "bg-green-100 text-green-700";
  if (val === "MULTIPLA_ESCOLHA") return "bg-blue-100 text-blue-700";
  if (val === "DESCRITIVA") return "bg-purple-100 text-purple-700";
  return "bg-zinc-100 text-zinc-700";
}

export default function QuestionsPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [filters, setFilters] = useState({
    subjectId: "",
    topicId: "",
    type: "",
    difficulty: "",
    status: "",
    source: "",
    search: "",
  });

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);

  const topics = useMemo(() => {
    if (!filters.subjectId) return [];
    return subjects.find((s) => s.id === Number(filters.subjectId))?.topics ?? [];
  }, [filters.subjectId, subjects]);

  useEffect(() => {
    api.get("/subjects").then((res) => setSubjects(res.data));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (filters.subjectId) params.set("subjectId", filters.subjectId);
    if (filters.topicId) params.set("topicId", filters.topicId);
    if (filters.type) params.set("type", filters.type);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.status) params.set("status", filters.status);
    if (filters.source) params.set("source", filters.source);
    if (filters.search) params.set("search", filters.search);

    api.get(`/questions?${params.toString()}`).then((res) => {
      if (cancelled) return;
      setQuestions(res.data.data ?? res.data);
      setTotal(res.data.total ?? 0);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [page, limit, filters]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map((q) => q.id)));
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!window.confirm("Excluir esta questão?")) return;
    try {
      await api.delete(`/questions/${id}`);
      setPage(1);
    } catch {
      // ignore
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getSubjectName = (id: number) =>
    subjects.find((s) => s.id === id)?.name ?? "-";
  const getTopicName = (q: Question) =>
    q.topic?.name ?? "-";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Questões</h1>
        <button
          onClick={() => router.push("/questions/new")}
          className="bg-zinc-900 text-white px-4 py-2 rounded text-sm hover:bg-zinc-800 cursor-pointer"
        >
          Nova Questão
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <select
            value={filters.subjectId}
            onChange={(e) => {
              setFilters((f) => ({
                ...f,
                subjectId: e.target.value,
                topicId: "",
              }));
              setPage(1);
            }}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="">Disciplina</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filters.topicId}
            onChange={(e) => {
              setFilters((f) => ({ ...f, topicId: e.target.value }));
              setPage(1);
            }}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="">Tópico</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => {
              setFilters((f) => ({ ...f, type: e.target.value }));
              setPage(1);
            }}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="">Tipo</option>
            <option value="MULTIPLA_ESCOLHA">Múltipla Escolha</option>
            <option value="DESCRITIVA">Descritiva</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => {
              setFilters((f) => ({ ...f, difficulty: e.target.value }));
              setPage(1);
            }}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="">Dificuldade</option>
            <option value="FACIL">Fácil</option>
            <option value="MEDIO">Médio</option>
            <option value="DIFICIL">Difícil</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }));
              setPage(1);
            }}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <option value="">Status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="REVISAO">Revisão</option>
            <option value="APROVADA">Aprovada</option>
          </select>

          <input
            type="text"
            value={filters.source}
            onChange={(e) => {
              setFilters((f) => ({ ...f, source: e.target.value }));
              setPage(1);
            }}
            placeholder="Fonte"
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />

          <input
            type="text"
            value={filters.search}
            onChange={(e) => {
              setFilters((f) => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
            placeholder="Buscar..."
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-700 rounded-full" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === questions.length &&
                        questions.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-medium">
                    Enunciado
                  </th>
                  <th className="text-left px-3 py-2 font-medium">
                    Disciplina
                  </th>
                  <th className="text-left px-3 py-2 font-medium">Tópico</th>
                  <th className="text-left px-3 py-2 font-medium">Tipo</th>
                  <th className="text-left px-3 py-2 font-medium">
                    Dificuldade
                  </th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Data</th>
                  <th className="text-left px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-b hover:bg-zinc-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(q.id)}
                        onChange={() => toggleSelect(q.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate">
                      {q.statement}
                    </td>
                    <td className="px-3 py-2">{getSubjectName(q.subjectId)}</td>
                    <td className="px-3 py-2">{getTopicName(q)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${badgeColor(q.type)}`}
                      >
                        {TYPE_MAP[q.type] ?? q.type}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${badgeColor(q.difficulty)}`}
                      >
                        {DIFFICULTY_MAP[q.difficulty] ?? q.difficulty}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${badgeColor(q.status)}`}
                      >
                        {STATUS_MAP[q.status] ?? q.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewQuestion(q)}
                          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/questions/edit/${q.id}`)
                          }
                          className="text-xs text-zinc-600 hover:text-zinc-800 cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-500">
                      Nenhuma questão encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-zinc-500">
                {total} resultado{total !== 1 ? "s" : ""} — Página {page} de{" "}
                {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {viewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setViewQuestion(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Detalhes da Questão
            </h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Enunciado:</strong> {viewQuestion.statement}
              </p>
              <p>
                <strong>Disciplina:</strong>{" "}
                {getSubjectName(viewQuestion.subjectId)}
              </p>
              <p>
                <strong>Tópico:</strong> {getTopicName(viewQuestion)}
              </p>
              <p>
                <strong>Tipo:</strong>{" "}
                {TYPE_MAP[viewQuestion.type] ?? viewQuestion.type}
              </p>
              <p>
                <strong>Dificuldade:</strong>{" "}
                {DIFFICULTY_MAP[viewQuestion.difficulty] ??
                  viewQuestion.difficulty}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {STATUS_MAP[viewQuestion.status] ?? viewQuestion.status}
              </p>
              {viewQuestion.source && (
                <p>
                  <strong>Fonte:</strong> {viewQuestion.source}
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewQuestion(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
