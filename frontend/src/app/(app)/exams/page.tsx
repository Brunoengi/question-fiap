"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Subject {
  id: number;
  name: string;
}

interface ExamQuestion {
  id: number;
  questionId: number;
  order: number;
  points: number;
  question?: { type: string };
}

interface Exam {
  id: number;
  title: string;
  subjectId: number;
  subject?: Subject;
  topicIds: number[];
  instructions?: string;
  examDate?: string;
  status: string;
  examQuestions: ExamQuestion[];
  createdAt: string;
}

function contarPorTipo(examQuestions: ExamQuestion[] | undefined) {
  const lista = examQuestions ?? [];
  const multiplaEscolha = lista.filter(
    (eq) => eq.question?.type === "MULTIPLE_CHOICE",
  ).length;
  const dissertativa = lista.filter(
    (eq) => eq.question?.type === "DESCRIPTIVE",
  ).length;
  return { total: lista.length, multiplaEscolha, dissertativa };
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: "Rascunho",
  FINALIZED: "Finalizada",
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

const PAGE_SIZE = 10;

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [examToDelete, setExamToDelete] = useState<number | null>(null);

  async function fetchExams() {
    setLoading(true);
    try {
      const res = await api.get("/exams");
      setExams(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExams();
  }, []);

  const confirmDeleteExam = async () => {
    if (examToDelete === null) return;
    try {
      await api.delete(`/exams/${examToDelete}`);
      setExamToDelete(null);
      fetchExams();
    } catch {
      // ignore
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  const totalPages = Math.max(1, Math.ceil(exams.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedExams = exams.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-700 rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Provas</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Título</th>
              <th className="text-left px-3 py-2 font-medium">Tema</th>
              <th className="text-left px-3 py-2 font-medium">Questões</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium">Data</th>
              <th className="text-left px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedExams.map((e) => {
              const { total, multiplaEscolha, dissertativa } = contarPorTipo(
                e.examQuestions,
              );
              return (
              <tr key={e.id} className="border-b bg-zinc-50 hover:bg-zinc-100">
                <td className="px-3 py-2 font-medium">{e.title}</td>
                <td className="px-3 py-2">{e.subject?.name ?? "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span>{total} {total === 1 ? "questão" : "questões"}</span>
                    {total > 0 && (
                      <span className="text-xs text-zinc-600">
                        {multiplaEscolha > 0 && `${multiplaEscolha} múltipla escolha`}
                        {multiplaEscolha > 0 && dissertativa > 0 && " · "}
                        {dissertativa > 0 && `${dissertativa} dissertativa${dissertativa !== 1 ? "s" : ""}`}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      e.status === "DRAFT"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {STATUS_MAP[e.status] ?? e.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-600">
                  {formatDate(e.examDate)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExamToDelete(e.id)}
                      className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
            {exams.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-600">
                  Nenhuma prova cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-zinc-600">
            {exams.length} resultado{exams.length !== 1 ? "s" : ""} — Página{" "}
            {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer"
            >
              Anterior
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={examToDelete !== null}
        title="Excluir prova"
        message="Tem certeza que deseja excluir esta prova? Essa ação não pode ser desfeita."
        onConfirm={confirmDeleteExam}
        onCancel={() => setExamToDelete(null)}
      />
    </div>
  );
}
