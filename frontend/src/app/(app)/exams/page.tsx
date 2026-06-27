"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  questions: ExamQuestion[];
  createdAt: string;
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: "Rascunho",
  FINALIZED: "Finalizada",
};

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteExam = async (id: number) => {
    if (!window.confirm("Excluir esta prova?")) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch {
      // ignore
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

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
        <button
          onClick={() => router.push("/exams/new")}
          className="bg-zinc-900 text-white px-4 py-2 rounded text-sm hover:bg-zinc-800 cursor-pointer"
        >
          Nova Prova
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Título</th>
              <th className="text-left px-3 py-2 font-medium">Disciplina</th>
              <th className="text-left px-3 py-2 font-medium">Questões</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium">Data</th>
              <th className="text-left px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.id} className="border-b hover:bg-zinc-50">
                <td className="px-3 py-2">
                  <button
                    onClick={() => router.push(`/exams/${e.id}`)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                  >
                    {e.title}
                  </button>
                </td>
                <td className="px-3 py-2">{e.subject?.name ?? "-"}</td>
                <td className="px-3 py-2">{e.questions?.length ?? 0}</td>
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
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {formatDate(e.examDate)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/exams/${e.id}`)}
                      className="text-xs text-zinc-600 hover:text-zinc-800 cursor-pointer"
                    >
                      Ver/Editar
                    </button>
                    <button
                      onClick={() => deleteExam(e.id)}
                      className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  Nenhuma prova cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
