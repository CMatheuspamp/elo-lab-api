import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Phone } from 'lucide-react';

export function PendingApproval() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-200/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

            <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-amber-500/10 border border-white relative z-10 animate-in zoom-in-95 duration-500 text-center">

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-amber-50 text-amber-500 mb-8 border border-amber-100 shadow-inner">
                    <Clock className="h-12 w-12 animate-pulse" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
                    Conta em Análise
                </h1>

                <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8">
                    O registo do seu laboratório foi recebido com sucesso! A nossa equipa está a rever os seus dados e entrará em contacto muito em breve para libertar o seu acesso.
                </p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 text-left">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Precisa de urgência?</h3>
                    <div className="flex flex-col gap-3">
                        <a href="tel:+351914498457" className="flex items-center gap-3 text-slate-600 hover:text-blue-600 font-medium transition-colors">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><Phone className="h-4 w-4" /></div>
                            +351 914 498 457
                        </a>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" /> Voltar ao Início
                </button>
            </div>
        </div>
    );
}