"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Topic {
  id: number;
  name: string;
  subjectId: number;
}

interface Subject {
  id: number;
  name: string;
  level: string;
  topics: Topic[];
}

const LEVELS = ["FUNDAMENTAL_I", "FUNDAMENTAL_II", "MEDIO"];

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", level: "FUNDAMENTAL_I" });
  const [topicForm, setTopicForm] = useState({ name: "", subjectId: 0 });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  async function fetchSubjects() {
    setLoading(true);
    try {
      const res = await api.get("/subjects");
      setSubjects(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get("/subjects").then((res) => setSubjects(res.data)).finally(() => setLoading(false));
  }, []);

  const openCreateSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ name: "", level: "FUNDAMENTAL_I" });
    setShowModal(true);
  };

  const openEditSubject = (s: Subject) => {
    setEditingSubject(s);
    setSubjectForm({ name: s.name, level: s.level });
    setShowModal(true);
  };

  const saveSubject = async () => {
    if (!subjectForm.name.trim()) return;
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, subjectForm);
      } else {
        await api.post("/subjects", subjectForm);
      }
      setShowModal(false);
      fetchSubjects();
    } catch {
      // ignore
    }
  };

  const deleteSubject = async (id: number) => {
    if (!window.confirm("Excluir esta disciplina e todos os tópicos?")) return;
    try {
      await api.delete(`/subjects/${id}`);
      fetchSubjects();
    } catch {
      // ignore
    }
  };

  const openCreateTopic = (subjectId: number) => {
    setEditingTopic(null);
    setTopicForm({ name: "", subjectId });
    setShowTopicModal(true);
  };

  const openEditTopic = (t: Topic) => {
    setEditingTopic(t);
    setTopicForm({ name: t.name, subjectId: t.subjectId });
    setShowTopicModal(true);
  };

  const saveTopic = async () => {
    if (!topicForm.name.trim()) return;
    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, topicForm);
      } else {
        await api.post("/topics", topicForm);
      }
      setShowTopicModal(false);
      fetchSubjects();
    } catch {
      // ignore
    }
  };

  const deleteTopic = async (id: number) => {
    if (!window.confirm("Excluir este tópico?")) return;
    try {
      await api.delete(`/topics/${id}`);
      fetchSubjects();
    } catch {
      // ignore
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Disciplinas</h1>
        <button
          onClick={openCreateSubject}
          className="bg-zinc-900 text-white px-4 py-2 rounded text-sm hover:bg-zinc-800 cursor-pointer"
        >
          Nova Disciplina
        </button>
      </div>

      <div className="space-y-3">
        {subjects.map((s) => {
          const isOpen = expanded.has(s.id);
          return (
            <div key={s.id} className="bg-white rounded-lg shadow-sm border">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-sm transition-transform">
                    {isOpen ? "▼" : "▶"}
                  </span>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                    {s.level}
                  </span>
                  <span className="text-xs text-zinc-400">
                    ({s.topics?.length ?? 0} tópicos)
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCreateTopic(s.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Adicionar Tópico
                  </button>
                  <button
                    onClick={() => openEditSubject(s)}
                    className="text-xs text-zinc-600 hover:text-zinc-800 cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteSubject(s.id)}
                    className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="border-t px-4 py-2 bg-zinc-50">
                  {s.topics?.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-2">
                      Nenhum tópico cadastrado.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {s.topics?.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between py-1 pl-4 border-l-2 border-zinc-200"
                        >
                          <span className="text-sm">{t.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditTopic(t)}
                              className="text-xs text-zinc-600 hover:text-zinc-800 cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteTopic(t.id)}
                              className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {subjects.length === 0 && (
          <p className="text-zinc-500 text-center py-12">
            Nenhuma disciplina cadastrada.
          </p>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingSubject ? "Editar Disciplina" : "Nova Disciplina"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={subjectForm.name}
              onChange={(e) =>
                setSubjectForm((f) => ({ ...f, name: e.target.value }))
              }
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="Nome da disciplina"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nível</label>
            <select
              value={subjectForm.level}
              onChange={(e) =>
                setSubjectForm((f) => ({ ...f, level: e.target.value }))
              }
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={saveSubject}
              className="px-4 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        title={editingTopic ? "Editar Tópico" : "Novo Tópico"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={topicForm.name}
              onChange={(e) =>
                setTopicForm((f) => ({ ...f, name: e.target.value }))
              }
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="Nome do tópico"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowTopicModal(false)}
              className="px-4 py-2 text-sm border rounded hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={saveTopic}
              className="px-4 py-2 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
