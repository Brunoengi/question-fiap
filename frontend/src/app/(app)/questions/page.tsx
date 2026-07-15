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
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
};

const TYPE_MAP: Record<string, string> = {
  MULTIPLE_CHOICE: "Múltipla Escolha",
  DESCRIPTIVE: "Descritiva",
};

function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-zinc-600 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
          >
            Não
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
          >
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function badgeColor(val: string) {
  if (val === "EASY") return "bg-zinc-100 text-zinc-700";
  if (val === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  if (val === "HARD") return "bg-red-100 text-red-700";
  if (val === "MULTIPLE_CHOICE") return "bg-blue-100 text-blue-700";
  if (val === "DESCRIPTIVE") return "bg-purple-100 text-purple-700";
  return "bg-zinc-100 text-zinc-700";
}

export default function QuestionsPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 10;

  const [filters, setFilters] = useState({
    subjectId: "",
    topicId: "",
    type: "",
    difficulty: "",
    source: "",
    search: "",
  });

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

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
    if (filters.source) params.set("source", filters.source);
    if (filters.search) params.set("search", filters.search);

    api.get(`/questions?${params.toString()}`).then((res) => {
      if (cancelled) return;
      setQuestions(res.data.data ?? res.data);
      setTotal(res.data.meta?.total ?? res.data.total ?? 0);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [page, limit, filters, refreshKey]);

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

  const confirmDeleteQuestion = async () => {
    if (questionToDelete === null) return;
    try {
      await api.delete(`/questions/${questionToDelete}`);
      setQuestionToDelete(null);
      setRefreshKey((k) => k + 1);
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
            <option value="">Tema</option>
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
            <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
            <option value="DESCRIPTIVE">Descritiva</option>
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
            <option value="EASY">Fácil</option>
            <option value="MEDIUM">Médio</option>
            <option value="HARD">Difícil</option>
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
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-x-auto">
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
                    Tema
                  </th>
                  <th className="text-left px-3 py-2 font-medium">Tópico</th>
                  <th className="text-left px-3 py-2 font-medium">Tipo</th>
                  <th className="text-left px-3 py-2 font-medium">
                    Dificuldade
                  </th>
                  <th className="text-left px-3 py-2 font-medium">Data</th>
                  <th className="text-left px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-b bg-zinc-50 hover:bg-zinc-100">
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
                    <td className="px-3 py-2 text-xs text-zinc-600">
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/questions/edit/${q.id}`)
                          }
                          className="text-xs text-zinc-600 hover:text-zinc-800 cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setQuestionToDelete(q.id)}
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
                    <td colSpan={8} className="text-center py-12 text-zinc-600">
                      Nenhuma questão encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-zinc-600">
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

      <ConfirmModal
        open={questionToDelete !== null}
        title="Excluir questão"
        message="Tem certeza que deseja excluir esta questão? Essa ação não pode ser desfeita."
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setQuestionToDelete(null)}
      />
    </div>
  );
}
