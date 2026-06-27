"use client";

import { useState, useEffect, useMemo } from "react";
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
  topic?: Topic;
}

interface SelectedQuestion {
  questionId: number;
  question: Question;
  order: number;
  points: number;
}

const TYPE_MAP: Record<string, string> = {
  MULTIPLA_ESCOLHA: "Múltipla Escolha",
  DESCRITIVA: "Descritiva",
};

const DIFFICULTY_MAP: Record<string, string> = {
  FACIL: "Fácil",
  MEDIO: "Médio",
  DIFICIL: "Difícil",
};

export default function NewExamPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<number>>(
    new Set()
  );
  const [instructions, setInstructions] = useState("");
  const [examDate, setExamDate] = useState("");

  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionFilterType, setQuestionFilterType] = useState("");
  const [questionFilterDifficulty, setQuestionFilterDifficulty] = useState("");

  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>(
    []
  );

  const [autoTotalCount, setAutoTotalCount] = useState("10");
  const [autoMultipleChoiceCount, setAutoMultipleChoiceCount] = useState("5");
  const [autoDescriptiveCount, setAutoDescriptiveCount] = useState("5");
  const [autoDifficulty, setAutoDifficulty] = useState("");
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<{
    multipleChoice: Question[];
    descriptive: Question[];
    total: number;
  } | null>(null);

  const [showPreview, setShowPreview] = useState(false);

  const topics = useMemo(() => {
    if (!subjectId) return [];
    return subjects.find((s) => s.id === Number(subjectId))?.topics ?? [];
  }, [subjectId, subjects]);

  useEffect(() => {
    api.get("/subjects").then((res) => setSubjects(res.data));
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setQuestions([]);
      return;
    }
    let cancelled = false;
    setLoadingQuestions(true);

    const params = new URLSearchParams();
    params.set("subjectId", String(subjectId));
    params.set("status", "PUBLISHED");
    params.set("limit", "100");
    if (questionFilterType) params.set("type", questionFilterType);
    if (questionFilterDifficulty)
      params.set("difficulty", questionFilterDifficulty);

    api
      .get(`/questions?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setQuestions(res.data.data ?? res.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, questionFilterType, questionFilterDifficulty]);

  const toggleTopic = (id: number) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isQuestionSelected = (id: number) =>
    selectedQuestions.some((sq) => sq.questionId === id);

  const toggleQuestion = (q: Question) => {
    if (isQuestionSelected(q.id)) {
      setSelectedQuestions((prev) =>
        prev
          .filter((sq) => sq.questionId !== q.id)
          .map((sq, i) => ({ ...sq, order: i + 1 }))
      );
    } else {
      setSelectedQuestions((prev) => [
        ...prev,
        {
          questionId: q.id,
          question: q,
          order: prev.length + 1,
          points: 10,
        },
      ]);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const next = [...selectedQuestions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= next.length) return;
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setSelectedQuestions(next.map((sq, i) => ({ ...sq, order: i + 1 })));
  };

  const updatePoints = (questionId: number, points: number) => {
    setSelectedQuestions((prev) =>
      prev.map((sq) =>
        sq.questionId === questionId ? { ...sq, points } : sq
      )
    );
  };

  const removeSelectedQuestion = (questionId: number) => {
    setSelectedQuestions((prev) =>
      prev
        .filter((sq) => sq.questionId !== questionId)
        .map((sq, i) => ({ ...sq, order: i + 1 }))
    );
  };

  const handleAutoSelect = async () => {
    setAutoLoading(true);
    setAutoResult(null);
    try {
      const res = await api.post("/exams/auto-select", {
        totalCount: Number(autoTotalCount),
        multipleChoiceCount: Number(autoMultipleChoiceCount),
        descriptiveCount: Number(autoDescriptiveCount),
        subjectId: Number(subjectId),
        difficulty: autoDifficulty || undefined,
      });
      setAutoResult(res.data);
    } catch {
      // ignore
    } finally {
      setAutoLoading(false);
    }
  };

  const applyAutoSelection = () => {
    if (!autoResult) return;

    const all: Question[] = [
      ...autoResult.multipleChoice,
      ...autoResult.descriptive,
    ];

    const mapped: SelectedQuestion[] = all.map((q, i) => ({
      questionId: q.id,
      question: q,
      order: i + 1,
      points: 10,
    }));

    setSelectedQuestions(mapped);
    setAutoResult(null);
  };

  const buildPayload = (status: string) => ({
    title,
    subjectId: Number(subjectId),
    topicIds: Array.from(selectedTopicIds),
    instructions: instructions || undefined,
    examDate: examDate || undefined,
    headerFields: [],
    questions: selectedQuestions.map((sq) => ({
      questionId: sq.questionId,
      order: sq.order,
      points: sq.points,
    })),
    status,
  });

  const handleSave = async (status: "DRAFT" | "FINALIZED") => {
    if (!title.trim() || !subjectId) return;
    setSaving(true);
    try {
      const payload = buildPayload(status);
      await api.post("/exams", payload);
      router.push("/exams");
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const canProceed = title.trim() && subjectId;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nova Prova</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setStep(1)}
          className={`px-4 py-2 rounded text-sm font-medium cursor-pointer ${
            step === 1
              ? "bg-zinc-900 text-white"
              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
          }`}
        >
          1. Dados da Prova
        </button>
        <button
          onClick={() => {
            if (canProceed) setStep(2);
          }}
          className={`px-4 py-2 rounded text-sm font-medium cursor-pointer ${
            step === 2
              ? "bg-zinc-900 text-white"
              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
          }`}
          disabled={!canProceed}
        >
          2. Selecionar Questões
        </button>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="Título da prova"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Disciplina
            </label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setSelectedTopicIds(new Set());
              }}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
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
              <label className="block text-sm font-medium mb-2">
                Tópicos
              </label>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => {
                  const sel = selectedTopicIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTopic(t.id)}
                      className={`px-3 py-1 rounded text-xs border cursor-pointer transition-colors ${
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
            <label className="block text-sm font-medium mb-1">
              Instruções
              <span className="text-zinc-400 font-normal"> (opcional)</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-y"
              placeholder="Instruções gerais da prova..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Data da Prova
              <span className="text-zinc-400 font-normal"> (opcional)</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceed}
              className="px-6 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("manual")}
              className={`px-4 py-2 rounded text-sm cursor-pointer ${
                mode === "manual"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode("auto")}
              className={`px-4 py-2 rounded text-sm cursor-pointer ${
                mode === "auto"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Automática
            </button>
          </div>

          {mode === "manual" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold">
                    Questões Disponíveis
                  </h2>
                  <select
                    value={questionFilterType}
                    onChange={(e) => setQuestionFilterType(e.target.value)}
                    className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="MULTIPLA_ESCOLHA">Múltipla Escolha</option>
                    <option value="DESCRITIVA">Descritiva</option>
                  </select>
                  <select
                    value={questionFilterDifficulty}
                    onChange={(e) =>
                      setQuestionFilterDifficulty(e.target.value)
                    }
                    className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="">Todas as dificuldades</option>
                    <option value="FACIL">Fácil</option>
                    <option value="MEDIO">Médio</option>
                    <option value="DIFICIL">Difícil</option>
                  </select>
                </div>

                {loadingQuestions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-4 border-zinc-300 border-t-zinc-700 rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {questions.map((q) => {
                      const sel = isQuestionSelected(q.id);
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
                            onChange={() => toggleQuestion(q)}
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
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600">
                                {DIFFICULTY_MAP[q.difficulty] ?? q.difficulty}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {questions.length === 0 && !loadingQuestions && (
                      <p className="text-sm text-zinc-400 text-center py-8">
                        Nenhuma questão encontrada. Selecione uma disciplina
                        primeiro.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-sm font-semibold mb-4">
                  Questões Selecionadas ({selectedQuestions.length})
                </h2>

                {selectedQuestions.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">
                    Nenhuma questão selecionada.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedQuestions.map((sq, idx) => (
                      <div
                        key={sq.questionId}
                        className="flex items-center gap-2 p-2 rounded border border-zinc-200 bg-zinc-50"
                      >
                        <div className="flex flex-col gap-0.5">
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
                        </div>
                        <span className="text-xs font-mono text-zinc-400 w-5 text-center">
                          {sq.order}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs line-clamp-1">
                            {sq.question.statement}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
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
                        </div>
                        <button
                          onClick={() =>
                            removeSelectedQuestion(sq.questionId)
                          }
                          className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === "auto" && (
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Total de Questões
                  </label>
                  <input
                    type="number"
                    value={autoTotalCount}
                    onChange={(e) => setAutoTotalCount(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Múltipla Escolha
                  </label>
                  <input
                    type="number"
                    value={autoMultipleChoiceCount}
                    onChange={(e) => setAutoMultipleChoiceCount(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Descritivas
                  </label>
                  <input
                    type="number"
                    value={autoDescriptiveCount}
                    onChange={(e) => setAutoDescriptiveCount(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={autoDifficulty}
                    onChange={(e) => setAutoDifficulty(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="">Qualquer</option>
                    <option value="FACIL">Fácil</option>
                    <option value="MEDIO">Médio</option>
                    <option value="DIFICIL">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  onClick={handleAutoSelect}
                  disabled={autoLoading || !subjectId}
                  className="px-4 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                >
                  {autoLoading ? "Gerando..." : "Gerar Seleção"}
                </button>
              </div>

              {autoResult && (
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm text-zinc-600">
                    {autoResult.total} questões selecionadas —{" "}
                    {autoResult.multipleChoice.length} múltipla escolha,{" "}
                    {autoResult.descriptive.length} descritivas
                  </p>

                  {autoResult.multipleChoice.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold mb-2">
                        Múltipla Escolha ({autoResult.multipleChoice.length})
                      </h3>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {autoResult.multipleChoice.map((q) => (
                          <div
                            key={q.id}
                            className="text-xs p-2 bg-zinc-50 rounded"
                          >
                            {q.statement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {autoResult.descriptive.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold mb-2">
                        Descritivas ({autoResult.descriptive.length})
                      </h3>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {autoResult.descriptive.map((q) => (
                          <div
                            key={q.id}
                            className="text-xs p-2 bg-zinc-50 rounded"
                          >
                            {q.statement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={applyAutoSelection}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                    >
                      Usar esta seleção
                    </button>
                    <button
                      onClick={() => setAutoResult(null)}
                      className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowPreview(true)}
              disabled={selectedQuestions.length === 0}
              className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
            >
              Visualizar Prova
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => handleSave("DRAFT")}
                disabled={saving || !title.trim() || !subjectId}
                className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Salvando..." : "Salvar Rascunho"}
              </button>
              <button
                onClick={() => handleSave("FINALIZED")}
                disabled={
                  saving ||
                  !title.trim() ||
                  !subjectId ||
                  selectedQuestions.length === 0
                }
                className="px-4 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Salvando..." : "Finalizar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPreview(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Prévia da Prova</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">
                {title || "Nova Prova"}
              </h3>
              {subjects.find((s) => s.id === Number(subjectId)) && (
                <p className="text-sm text-zinc-500">
                  {subjects.find((s) => s.id === Number(subjectId))!.name}
                </p>
              )}
              {instructions && (
                <p className="text-sm text-zinc-600 mt-2 whitespace-pre-wrap">
                  {instructions}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {selectedQuestions.map((sq) => (
                <div key={sq.questionId} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-500">
                      Questão {sq.order}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {sq.points} pontos
                    </span>
                  </div>
                  <p className="text-sm">{sq.question.statement}</p>
                </div>
              ))}
              {selectedQuestions.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-8">
                  Nenhuma questão adicionada.
                </p>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowPreview(false)}
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
