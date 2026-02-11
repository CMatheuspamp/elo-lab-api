import { useState } from 'react';
import { api } from '../services/api';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify'; // <--- IMPORT DO NOSSO NOTIFY

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Efetuar Login
            const response = await api.post('/Auth/login', { email, password });

            // AGORA RECEBEMOS A COR E A LOGO AQUI
            const { token, tipo, corPrimaria, logoUrl } = response.data;

            // 2. Salvar Token e Dados de Aparência
            localStorage.setItem('elolab_token', token);
            localStorage.setItem('elolab_user_type', tipo);

            // === NOVO: Salvar Aparência ===
            // Se vier nulo, usamos o azul padrão
            localStorage.setItem('elolab_user_color', corPrimaria || '#2563EB');
            if (logoUrl) {
                localStorage.setItem('elolab_user_logo', logoUrl);
            } else {
                localStorage.removeItem('elolab_user_logo');
            }
            // ==============================

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // 3. Redirecionar
            if (tipo === 'Clinica') {
                navigate('/parceiros');
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            // === NOVO: Usa a nossa notificação de erro ===
            notify.error('Falha na autenticação. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">EloLab</h1>
                    <p className="mt-2 text-sm text-slate-500">Gestão inteligente para laboratórios e clínicas</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Email Corporativo
                            </label>
                            <div className="relative group">
                                <Mail className="absolute top-2.5 left-3 h-5 w-5 text-slate-400 transition group-focus-within:text-blue-600" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                                    placeholder="nome@empresa.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Senha
                            </label>
                            <div className="relative group">
                                <Lock className="absolute top-2.5 left-3 h-5 w-5 text-slate-400 transition group-focus-within:text-blue-600" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Acessar Plataforma <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-xs text-slate-400">
                    &copy; 2026 EloLab Systems. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}