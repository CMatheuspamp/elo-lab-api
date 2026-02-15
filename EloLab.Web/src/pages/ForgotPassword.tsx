import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { notify } from '../utils/notify';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    async function handleRecover(e: React.FormEvent) {
        e.preventDefault();

        if (!email.trim() || !email.includes('@')) {
            notify.error("Por favor, introduza um e-mail válido.");
            return;
        }

        setLoading(true);

        try {
            // Chama a nova rota que acabaste de criar no C#
            await api.post('/Auth/recuperar-senha', `"${email}"`, {
                headers: { 'Content-Type': 'application/json' }
            });

            setSucesso(true);
        } catch (error) {
            notify.error("Ocorreu um erro ao tentar enviar o e-mail.");
        } finally {
            setLoading(false);
        }
    }

    if (sucesso) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
                <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white max-w-md w-full text-center relative z-10 animate-in zoom-in-95">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-3">Verifique o seu E-mail</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        Enviámos as instruções de recuperação para <span className="font-bold text-slate-900">{email}</span>. Pode demorar alguns minutos a chegar.
                    </p>
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">Voltar ao Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white relative z-10 animate-in slide-in-from-bottom-8">
                <Link to="/login" className="absolute top-8 left-8 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition">
                    <ArrowLeft className="h-5 w-5" />
                </Link>

                <div className="text-center mt-6 mb-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6">
                        <ShieldAlert className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recuperar Senha</h1>
                    <p className="text-slate-500 mt-2 font-medium">Introduza o e-mail associado à sua conta para receber o link de redefinição.</p>
                </div>

                <form onSubmit={handleRecover} className="space-y-6">
                    <div>
                        <div className="relative group">
                            <Mail className="absolute top-4 left-4 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                autoFocus
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-4 pl-12 pr-4 outline-none transition-all focus:bg-white focus:ring-4 focus:border-blue-600 focus:ring-blue-600/10 font-medium"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Enviar E-mail de Recuperação'}
                    </button>
                </form>
            </div>
        </div>
    );
}