import { useState } from 'react';
import { api } from '../services/api';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { notify } from '../utils/notify';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/Auth/login', { email, password });
            const { token, tipo, corPrimaria, logoUrl } = response.data;

            localStorage.setItem('elolab_token', token);
            localStorage.setItem('elolab_user_type', tipo);
            localStorage.setItem('elolab_user_color', corPrimaria || '#2563EB');

            if (logoUrl) {
                localStorage.setItem('elolab_user_logo', logoUrl);
            } else {
                localStorage.removeItem('elolab_user_logo');
            }

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const tokenConvite = localStorage.getItem('elolab_token_convite');
            if (tokenConvite && tipo === 'Clinica') {
                try {
                    await api.post(`/Auth/convite/aceitar/${tokenConvite}`);
                    notify.success("Convite aceite! Vínculo criado com sucesso.");
                } catch (error) {
                    console.error("Erro ao aceitar convite:", error);
                } finally {
                    localStorage.removeItem('elolab_token_convite');
                }
            }

            if (tipo === 'Clinica') {
                navigate('/parceiros');
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            notify.error('Falha na autenticação. Verifique as suas credenciais.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Left Side - Image/Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/40 z-10" />
                {/* Abstract tech pattern background could go here. We'll use radial gradients for now. */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,_rgba(37,99,235,0.15),transparent_50%)]" />

                <div className="relative z-20 max-w-lg p-12">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-lg">
                            EL
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">EloLab</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Acesso ao portal de gestão integrada.</h2>
                    <p className="text-lg text-slate-300">Efetue login para gerir os seus pedidos, consultar tabelas de preços e comunicar com os seus parceiros.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 relative">
                {/* Mobile Logo (Only visible when Left Side is hidden) */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs shadow-sm">
                        EL
                    </div>
                    <span className="font-bold text-slate-900">EloLab</span>
                </div>

                <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h1>
                        <p className="mt-2 text-slate-500">Insira as suas credenciais para aceder à sua conta.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Email Corporativo
                            </label>
                            <div className="relative group">
                                <Mail className="absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-base text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 shadow-sm"
                                    placeholder="nome@empresa.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Senha
                                </label>
                                {/* Future feature link */}
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">Esqueceu a senha?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-base text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar na Plataforma <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500">
                            Ainda não tem conta?{' '}
                            <Link to="/registro" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition">
                                Registe-se agora
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}