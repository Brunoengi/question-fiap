"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Subject {
  id: number;
  name: string;
  topics: Topic[];
}

interface Topic {
  id: number;
  name: string;
  subjectId: number;
}

interface Alternative {
  label: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionData {
  id: number;
  subjectId: number;
  topicId: number;
  type: string;
  difficulty: string;
  source: string;
  status: string;
  statement: string;
  solution: string;
  tags: string[];
  alternatives: Alternative[];
}

const LABELS = "ABCDEFGHIJ";

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState("MULTIPLA_ESCOLHA");
  const [difficulty, setDifficulty] = useState("FACIL");
  const [statement, setStatement] = useState("");
  const [solution, setSolution] = useState("");
  const [tags, setTags] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("RASCUNHO");
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);

  const topics = useMemo(() => {
    if (!subjectId) return [];
    return subjects.find((s) => s.id === Number(subjectId))?.topics ?? [];
  }, [subjectId, subjects]);

  useEffect(() => {
    api.get("/subjects").then((res) => setSubjects(res.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    api.get<QuestionData>(`/questions/${id}`).then((res) => {
      if (cancelled) return;
      const q = res.data;
      setSubjectId(String(q.subjectId));
      setTopicId(String(q.topicId));
      setType(q.type);
      setDifficulty(q.difficulty);
      setStatement(q.statement ?? "");
      setSolution(q.solution ?? "");
      setTags((q.tags ?? []).join(", "));
      setSource(q.source ?? "");
      setStatus(q.status);
      setAlternatives(
        (q.alternatives ?? []).map((a) => ({
          label: a.label,
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      );
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id]);

  const addAlternative = () => {
    setAlternatives((prev) => [
      ...prev,
      { label: LABELS[prev.length] ?? "?", text: "", isCorrect: false },
    ]);
  };

  const removeAlternative = (idx: number) => {
    setAlternatives((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((a, i) => ({ ...a, label: LABELS[i] ?? a.label }));
    });
  };

  const updateAlternative = (
    idx: number,
    data: Partial<Alternative>,
  ) => {
    setAlternatives((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...data } : a)),
    );
  };

  const setCorrect = (idx: number) => {
    setAlternatives((prev) =>
      prev.map((a, i) => ({ ...a, isCorrect: i === idx })),
    );
  };

  const handleSave = async () => {
    if (!subjectId || !topicId || !statement.trim()) return;
    setSaving(true);
    try {
      await api.put(`/questions/${id}`, {
        subjectId: Number(subjectId),
        topicId: Number(topicId),
        type,
        difficulty,
        source: source || undefined,
        status,
        statement: statement.trim(),
        solution: solution.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        alternatives:
          type === "MULTIPLA_ESCOLHA"
            ? alternatives.map((a) => ({
                label: a.label,
                text: a.text,
                isCorrect: a.isCorrect,
              }))
            : [],
      });
      router.push("/questions");
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-700 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar Questão</h1>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Disciplina
            </label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId("");
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

          <div>
            <label className="block text-sm font-medium mb-1">Tópico</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              disabled={!subjectId}
            >
              <option value="">Selecione...</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="MULTIPLA_ESCOLHA"
                  checked={type === "MULTIPLA_ESCOLHA"}
                  onChange={() => setType("MULTIPLA_ESCOLHA")}
                />
                Múltipla Escolha
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="DESCRITIVA"
                  checked={type === "DESCRITIVA"}
                  onChange={() => setType("DESCRITIVA")}
                />
                Descritiva
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Dificuldade
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            >
              <option value="FACIL">Fácil</option>
              <option value="MEDIO">Médio</option>
              <option value="DIFICIL">Difícil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="REVISAO">Revisão</option>
              <option value="APROVADA">Aprovada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fonte</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="Ex: ENEM 2024"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="Separadas por vírgula"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Enunciado</label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={6}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-y"
            placeholder="Digite o enunciado da questão..."
          />
        </div>

        {type === "MULTIPLA_ESCOLHA" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Alternativas</label>
              <button
                onClick={addAlternative}
                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                + Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {alternatives.map((a, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded border bg-zinc-50"
                >
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="correct"
                      checked={a.isCorrect}
                      onChange={() => setCorrect(idx)}
                    />
                    <span className="text-xs font-bold w-5 text-center">
                      {a.label}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={a.text}
                    onChange={(e) =>
                      updateAlternative(idx, { text: e.target.value })
                    }
                    placeholder={`Alternativa ${a.label}`}
                    className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white"
                  />
                  {alternatives.length > 2 && (
                    <button
                      onClick={() => removeAlternative(idx)}
                      className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Solução / Gabarito comentado
            <span className="text-zinc-400 font-normal"> (opcional)</span>
          </label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={4}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-y"
            placeholder="Digite a solução ou comentário..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => router.push("/questions")}
            className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
