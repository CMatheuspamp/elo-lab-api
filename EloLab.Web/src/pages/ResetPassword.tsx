import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { notify } from '../utils/notify';
import { Lock, Loader2, ShieldCheck, Check, X } from 'lucide-react';

export function ResetPassword() {
    const navigate = useNavigate();
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);

    const isLengthValid = senha.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(senha);
    const hasNumber = /[0-9]/.test(senha);
    const isPasswordValid = isLengthValid && hasLetter && hasNumber;
    const passwordsMatch = senha === confirmarSenha && senha !== '';

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault();

        if (!isPasswordValid || !passwordsMatch) {
            notify.error("Verifique os requisitos da nova senha.");
            return;
        }

        setLoading(true);

        try {
            // O utilizador já tem uma "sessão de recuperação" ativa, por isso basta atualizar!
            const { error } = await supabase.auth.updateUser({
                password: senha
            });

            if (error) throw error;

            notify.success("Senha atualizada com sucesso! Já pode fazer login.");

            // Fazemos logout para obrigar a entrar com a senha nova
            await supabase.auth.signOut();
            navigate('/login');

        } catch (error: any) {
            console.error(error);
            notify.error("Erro ao atualizar a senha. O link pode ter expirado.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white relative z-10 animate-in zoom-in-95">
                <div className="text-center mb-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-6">
                        <ShieldCheck className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nova Senha</h1>
                    <p className="text-slate-500 mt-2 font-medium">Crie uma nova senha segura para a sua conta.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                        <div className="relative group mb-3">
                            <Lock className="absolute top-4 left-4 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                            <input autoFocus required type="password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-4 pl-12 pr-4 outline-none transition-all focus:bg-white focus:ring-4 focus:border-emerald-600 focus:ring-emerald-600/10 font-medium" placeholder="Nova Senha" />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-xs font-medium">
                                {isLengthValid ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-slate-300" />}
                                <span className={isLengthValid ? "text-emerald-700" : "text-slate-500"}>Mínimo de 8 caracteres</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                {hasLetter ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-slate-300" />}
                                <span className={hasLetter ? "text-emerald-700" : "text-slate-500"}>Pelo menos uma letra</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                {hasNumber ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-slate-300" />}
                                <span className={hasNumber ? "text-emerald-700" : "text-slate-500"}>Pelo menos um número</span>
                            </div>
                        </div>

                        <div className="relative group">
                            <Lock className="absolute top-4 left-4 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                            <input required type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className={`w-full rounded-2xl border bg-slate-50/50 py-4 pl-12 pr-4 outline-none transition-all focus:bg-white focus:ring-4 font-medium ${confirmarSenha && !passwordsMatch ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="Confirmar Nova Senha" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading || !isPasswordValid || !passwordsMatch} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}