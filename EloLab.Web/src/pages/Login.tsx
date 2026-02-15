import { useState } from 'react';
import { api } from '../services/api';
import { Lock, Mail, Loader2, ArrowRight, Activity } from 'lucide-react';
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

            // 1. Extrai os dados da resposta
            const { token, usuarioId, tipo, nome, corPrimaria, logoUrl } = response.data;

            // 2. Guarda na memória do navegador
            localStorage.setItem('elolab_token', token);
            localStorage.setItem('elolab_user_id', usuarioId); // Adicionado por precaução
            localStorage.setItem('elolab_user_type', tipo);
            localStorage.setItem('elolab_user_name', nome);    // Adicionado por precaução
            localStorage.setItem('elolab_user_color', corPrimaria || '#2563EB');

            if (logoUrl) {
                localStorage.setItem('elolab_user_logo', logoUrl);
            } else {
                localStorage.removeItem('elolab_user_logo');
            }

            // 3. Define o Token no Axios para os próximos pedidos
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // 4. Lógica de Convite da Clínica
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

            // 5. Redirecionamento de Sucesso
            if (tipo === 'Clinica') {
                navigate('/parceiros');
            } else if (tipo === 'Laboratorio') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }

            notify.success(`Bem-vindo de volta!`);

        } catch (error: any) {
            // === BLOQUEIO DE SEGURANÇA MÁXIMA PARA PRODUÇÃO ===
            // Se o Backend mandar o Erro 403 com o texto "PENDENTE", 
            // significa que o Laboratório não está ativo.
            if (error.response?.status === 403 && error.response?.data?.erro === 'PENDENTE') {
                navigate('/pendente');
                return;
            }
            // ===================================================

            console.error(error);
            // Mensagem de erro genérica (ou enviada pela API) para outros casos
            notify.error(error.response?.data?.erro || error.response?.data?.mensagem || 'Falha na autenticação. Verifique as suas credenciais.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50 relative overflow-hidden">

            {/* Textura de fundo do formulário */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Left Side - Image/Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-slate-900 overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700/30 to-slate-900/80 z-10 mix-blend-multiply" />
                {/* Padrão abstrato escuro */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px] opacity-30 z-0"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full z-0"></div>

                <div className="relative z-20 w-full max-w-lg">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 font-black text-white shadow-xl shadow-blue-500/20 border border-blue-400/30">
                            EL
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">EloLab</span>
                    </div>

                    <h2 className="text-4xl font-black text-white mb-6 leading-tight drop-shadow-md">Acesso ao portal de gestão integrada.</h2>
                    <p className="text-lg text-slate-300 font-medium leading-relaxed">Efetue login para gerir os seus pedidos, consultar tabelas de preços e comunicar com os seus parceiros de forma fluida e segura.</p>

                    {/* Cartão UI Falso (Decorativo para preencher espaço) */}
                    <div className="mt-16 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atividade Recente</span>
                            <Activity className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 w-full bg-white/10 rounded-full"></div>
                            <div className="h-2 w-3/4 bg-blue-500/50 rounded-full"></div>
                            <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex w-full lg:w-[55%] items-center justify-center p-8 sm:p-12 relative z-10">
                {/* Mobile Logo */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs shadow-md">
                        EL
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight">EloLab</span>
                </div>

                <div className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-500 fade-in">
                    <div className="mb-10 bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden">
                        {/* Brilho sutil no topo do cartão */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>

                        <div className="mb-8">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">Bem-vindo de volta</h1>
                            <p className="mt-2 text-slate-500 font-medium">Insira as suas credenciais para aceder.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Email Corporativo
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pr-4 pl-11 text-base text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 shadow-sm"
                                        placeholder="nome@empresa.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-slate-700">
                                        Senha
                                    </label>
                                    <Link to="/esqueci-senha" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pr-4 pl-11 text-base text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 shadow-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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
                    </div>

                    <div className="mt-8 text-center bg-white/60 backdrop-blur-sm py-4 rounded-2xl border border-white shadow-sm">
                        <p className="text-slate-500 font-medium">
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