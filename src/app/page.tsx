import Link from "next/link";
import { Beef, LogIn, ArrowRight } from "lucide-react";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-linear-to-b from-emerald-100 via-slate-50 to-white dark:from-emerald-950/20 dark:via-neutral-950 dark:to-black">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
            <Beef size={48} strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bem-vindo ao <span className="text-emerald-600">Pecuária Inteligente</span>.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            O futuro da gestão pecuária. Gerencie o seu rebanho com inteligência, dados em tempo real e precisão absoluta.
          </p>
        </div>

        <div className="flex items-center justify-center pt-4">
          <Link
            href="/login"
            className="group relative flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-emerald-600/30"
          >
            <LogIn size={20} />
            <span>Entrar</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { title: "Conexão com Balança", desc: "Leitura automatizada via RFIDs." },
            { title: "Histórico Completo", desc: "Pesagens, vacinas e transferências." },
            { title: "Rastreabilidade", desc: "Saiba tudo sobre a origem e destino." }
          ].map((feature, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-neutral-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}