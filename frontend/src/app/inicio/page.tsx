import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Question | Bem-vindo",
};

const recursos = [
  {
    titulo: "Aulas com IA",
    descricao:
      "Gere aulas completas em segundos com apoio de inteligência artificial: conteúdo, questões e prova prontos em um único passo.",
    emoji: "✨",
  },
  {
    titulo: "Temas",
    descricao:
      "Cada aula gerada organiza automaticamente seus temas e tópicos, mantendo tudo estruturado em um só lugar.",
    emoji: "📚",
  },
  {
    titulo: "Questões",
    descricao:
      "Consulte, edite e gerencie o banco de questões criado pela IA a partir das aulas geradas.",
    emoji: "📝",
  },
  {
    titulo: "Provas",
    descricao:
      "Toda aula já gera automaticamente uma prova com as questões correspondentes, pronta para consulta.",
    emoji: "🗂️",
  },
];

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Question</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Prepare aulas, questões e provas com apoio de IA
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            O Question ajuda professores a gerar aulas completas com IA —
            conteúdo, questões e provas prontos, organizados automaticamente
            por tema.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Começar agora
            </Link>
            <Link
              href="/login"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recursos.map((recurso) => (
            <div
              key={recurso.titulo}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
            >
              <span className="text-3xl">{recurso.emoji}</span>
              <h2 className="mt-4 font-semibold text-gray-700">
                {recurso.titulo}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {recurso.descricao}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-gray-200 px-6 py-6 text-center text-sm text-gray-500">
        Question — plataforma de apoio pedagógico
      </footer>
    </div>
  );
}
