"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Topic {
  id: number;
  name: string;
  subjectId: number;
}

interface Subject {
  id: number;
  name: string;
  topics: Topic[];
}

interface Question {
  id: number;
  statement: string;
  subjectId: number;
  topicId: number;
  type: string;
  difficulty: string;
  status: string;
}

interface ExamQuestion {
  id: number;
  questionId: number;
  order: number;
  points: number;
  question?: Question;
}

interface Exam {
  id: number;
  title: string;
  subjectId: number;
  subject?: Subject;
  topicIds: number[];
  topics?: Topic[];
  instructions?: string;
  examDate?: string;
  headerFields?: { label: string; value: string }[];
  questions: ExamQuestion[];
  status: string;
  createdAt: string;
}

interface SelectedQuestion {
  questionId: number;
  question: Question;
  order: number;
  points: number;
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: "Rascunho",
  FINALIZED: "Finalizada",
};

const TYPE_MAP: Record<string, string> = {
  MULTIPLA_ESCOLHA: "Múltipla Escolha",
  DESCRITIVA: "Descritiva",
};

const DIFFICULTY_MAP: Record<string, string> = {
  FACIL: "Fácil",
  MEDIO: "Médio",
  DIFICIL: "Difícil",
};

export default function ViewExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editTopicIds, setEditTopicIds] = useState<Set<number>>(new Set());
  const [editInstructions, setEditInstructions] = useState("");
  const [editExamDate, setEditExamDate] = useState("");

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<
    SelectedQuestion[]
  >([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFilterType, setAddFilterType] = useState("");
  const [addLoadingQuestions, setAddLoadingQuestions] = useState(false);
  const [addCheckSet, setAddCheckSet] = useState<Set<number>>(new Set());

  const topics = useMemo(() => {
    if (!editSubjectId) return [];
    return (
      subjects.find((s) => s.id === Number(editSubjectId))?.topics ?? []
    );
  }, [editSubjectId, subjects]);

  useEffect(() => {
    api.get("/subjects").then((res) => setSubjects(res.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    api
      .get(`/exams/${id}`)
      .then((res) => {
        if (cancelled) return;
        const e: Exam = res.data;
        setExam(e);
        setEditTitle(e.title);
        setEditSubjectId(String(e.subjectId));
        setEditTopicIds(new Set(e.topicIds ?? []));
        setEditInstructions(e.instructions ?? "");
        setEditExamDate(e.examDate?.split("T")[0] ?? "");

        if (e.questions) {
          setSelectedQuestions(
            e.questions.map((eq) => ({
              questionId: eq.questionId,
              question: (eq.question ?? {
                id: eq.questionId,
                statement: `Questão #${eq.questionId}`,
                subjectId: e.subjectId,
                topicId: 0,
                type: "",
                difficulty: "",
                status: "",
              }) as Question,
              order: eq.order,
              points: eq.points,
            }))
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadAvailableQuestions = () => {
    if (!editSubjectId) return;
    setAddLoadingQuestions(true);
    const params = new URLSearchParams();
    params.set("subjectId", String(editSubjectId));
    params.set("status", "PUBLISHED");
    params.set("limit", "100");
    if (addFilterType) params.set("type", addFilterType);

    api
      .get(`/questions?${params.toString()}`)
      .then((res) => {
        setAvailableQuestions(res.data.data ?? res.data ?? []);
      })
      .finally(() => setAddLoadingQuestions(false));
  };

  const openAddModal = () => {
    setAddCheckSet(new Set());
    setAddFilterType("");
    setShowAddModal(true);
    loadAvailableQuestions();
  };

  const toggleAddCheck = (id: number) => {
    setAddCheckSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmAddQuestions = () => {
    if (addCheckSet.size === 0) return;
    const newQuestions = availableQuestions.filter((q) =>
      addCheckSet.has(q.id)
    );
    const startOrder =
      selectedQuestions.length > 0
        ? Math.max(...selectedQuestions.map((sq) => sq.order)) + 1
        : 1;

    const added: SelectedQuestion[] = newQuestions.map((q, i) => ({
      questionId: q.id,
      question: q,
      order: startOrder + i,
      points: 10,
    }));

    setSelectedQuestions((prev) => [...prev, ...added]);
    setShowAddModal(false);
    saveQuestions([
      ...selectedQuestions,
      ...added,
    ]);
  };

  const updatePoints = (questionId: number, points: number) => {
    setSelectedQuestions((prev) =>
      prev.map((sq) =>
        sq.questionId === questionId ? { ...sq, points } : sq
      )
    );
  };

  const removeSelectedQuestion = (questionId: number) => {
    const next = selectedQuestions
      .filter((sq) => sq.questionId !== questionId)
      .map((sq, i) => ({ ...sq, order: i + 1 }));
    setSelectedQuestions(next);
    saveQuestions(next);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const next = [...selectedQuestions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= next.length) return;
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    const reordered = next.map((sq, i) => ({ ...sq, order: i + 1 }));
    setSelectedQuestions(reordered);
    saveQuestions(reordered);
  };

  const saveQuestions = async (questions: SelectedQuestion[]) => {
    try {
      await api.put(`/exams/${id}/questions`, {
        questions: questions.map((sq) => ({
          questionId: sq.questionId,
          order: sq.order,
          points: sq.points,
        })),
      });
    } catch {
      // ignore
    }
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editSubjectId) return;
    setSaving(true);
    try {
      await api.put(`/exams/${id}`, {
        title: editTitle,
        subjectId: Number(editSubjectId),
        topicIds: Array.from(editTopicIds),
        instructions: editInstructions || undefined,
        examDate: editExamDate || undefined,
        headerFields: exam?.headerFields ?? [],
        questions: selectedQuestions.map((sq) => ({
          questionId: sq.questionId,
          order: sq.order,
          points: sq.points,
        })),
      });
      router.push("/exams");
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Finalizar esta prova? Após finalizada, não poderá ser editada.")) return;
    try {
      await api.patch(`/exams/${id}/status`, { status: "FINALIZED" });
      setExam((prev) => (prev ? { ...prev, status: "FINALIZED" } : prev));
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Excluir esta prova?")) return;
    try {
      await api.delete(`/exams/${id}`);
      router.push("/exams");
    } catch {
      // ignore
    }
  };

  const getSubjectName = (subjectId: number) =>
    subjects.find((s) => s.id === subjectId)?.name ?? exam?.subject?.name ?? "-";

  const toggleTopic = (topicId: number) => {
    setEditTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-700 rounded-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Prova não encontrada.
      </div>
    );
  }

  const isDraft = exam.status === "DRAFT";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              isDraft
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {STATUS_MAP[exam.status] ?? exam.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              window.open(
                `${api.defaults.baseURL}/exams/${id}/preview`,
                "_blank"
              )
            }
            className="px-3 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
          >
            Preview
          </button>
          <button
            onClick={() => {
              const url = `${api.defaults.baseURL}/exams/${id}/export/pdf`;
              const link = document.createElement("a");
              link.href = url;
              link.download = "";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
          >
            Exportar PDF
          </button>
          {isDraft && (
            <button
              onClick={handleFinalize}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
            >
              Finalizar
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            <h2 className="text-sm font-semibold">Detalhes</h2>

            {!isDraft ? (
              <>
                <div>
                  <p className="text-xs text-zinc-400">Título</p>
                  <p className="text-sm">{exam.title}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Disciplina</p>
                  <p className="text-sm">{getSubjectName(exam.subjectId)}</p>
                </div>
                {exam.topics && exam.topics.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-400">Tópicos</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exam.topics.map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-700"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {exam.instructions && (
                  <div>
                    <p className="text-xs text-zinc-400">Instruções</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {exam.instructions}
                    </p>
                  </div>
                )}
                {exam.examDate && (
                  <div>
                    <p className="text-xs text-zinc-400">Data</p>
                    <p className="text-sm">
                      {new Date(exam.examDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Disciplina
                  </label>
                  <select
                    value={editSubjectId}
                    onChange={(e) => {
                      setEditSubjectId(e.target.value);
                      setEditTopicIds(new Set());
                    }}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="">Selecione...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                {topics.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Tópicos
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {topics.map((t) => {
                        const sel = editTopicIds.has(t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => toggleTopic(t.id)}
                            className={`px-2 py-0.5 rounded text-xs border cursor-pointer transition-colors ${
                              sel
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                            }`}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Instruções
                  </label>
                  <textarea
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    rows={3}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={editExamDate}
                    onChange={(e) => setEditExamDate(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                </div>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full px-4 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">
                Questões ({selectedQuestions.length})
              </h2>
              {isDraft && (
                <button
                  onClick={openAddModal}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  Adicionar Questões
                </button>
              )}
            </div>

            {selectedQuestions.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">
                Nenhuma questão adicionada.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedQuestions.map((sq, idx) => (
                  <div
                    key={sq.questionId}
                    className="flex items-start gap-3 p-3 rounded border border-zinc-200"
                  >
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      {isDraft && (
                        <>
                          <button
                            onClick={() => moveQuestion(idx, "up")}
                            disabled={idx === 0}
                            className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30 cursor-pointer leading-none"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveQuestion(idx, "down")}
                            disabled={idx === selectedQuestions.length - 1}
                            className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30 cursor-pointer leading-none"
                          >
                            ▼
                          </button>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-mono text-zinc-400 mt-1 w-5 text-center">
                      {sq.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{sq.question.statement}</p>
                      {sq.question.type && (
                        <div className="flex gap-1 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600">
                            {TYPE_MAP[sq.question.type] ?? sq.question.type}
                          </span>
                          {sq.question.difficulty && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600">
                              {DIFFICULTY_MAP[sq.question.difficulty] ??
                                sq.question.difficulty}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isDraft ? (
                        <>
                          <label className="text-[10px] text-zinc-500">
                            Pts
                          </label>
                          <input
                            type="number"
                            value={sq.points}
                            onChange={(e) =>
                              updatePoints(
                                sq.questionId,
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-14 border rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-zinc-300"
                            min={0}
                          />
                          <button
                            onClick={() => removeSelectedQuestion(sq.questionId)}
                            className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400">
                          {sq.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Adicionar Questões</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-sm text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <select
                value={addFilterType}
                onChange={(e) => {
                  setAddFilterType(e.target.value);
                  setTimeout(() => loadAvailableQuestions(), 0);
                }}
                className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-300"
              >
                <option value="">Todos os tipos</option>
                <option value="MULTIPLA_ESCOLHA">Múltipla Escolha</option>
                <option value="DESCRITIVA">Descritiva</option>
              </select>
              <button
                onClick={loadAvailableQuestions}
                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Atualizar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {addLoadingQuestions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-4 border-zinc-300 border-t-zinc-700 rounded-full" />
                </div>
              ) : (
                availableQuestions
                  .filter(
                    (q) =>
                      !selectedQuestions.some(
                        (sq) => sq.questionId === q.id
                      )
                  )
                  .map((q) => {
                    const sel = addCheckSet.has(q.id);
                    return (
                      <label
                        key={q.id}
                        className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          sel
                            ? "bg-blue-50 border-blue-300"
                            : "border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => toggleAddCheck(q.id)}
                          className="mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs line-clamp-2">
                            {q.statement}
                          </p>
                          <div className="flex gap-1 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600">
                              {TYPE_MAP[q.type] ?? q.type}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })
              )}
              {availableQuestions.filter(
                (q) =>
                  !selectedQuestions.some(
                    (sq) => sq.questionId === q.id
                  )
              ).length === 0 &&
                !addLoadingQuestions && (
                  <p className="text-sm text-zinc-400 text-center py-8">
                    Nenhuma questão disponível para adicionar.
                  </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddQuestions}
                disabled={addCheckSet.size === 0}
                className="px-4 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
              >
                Adicionar ({addCheckSet.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
