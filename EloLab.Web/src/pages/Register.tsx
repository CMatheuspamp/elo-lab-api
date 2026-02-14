import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { notify } from '../utils/notify';
import {
    Building2, Smile, User, Mail, Lock,
    Phone, FileText, Loader2, ArrowLeft, CheckCircle2, ChevronRight
} from 'lucide-react';

export function Register() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenURL = searchParams.get('token');

    const [tipoConta, setTipoConta] = useState<'laboratorio' | 'clinica' | null>(null);
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    const [nomeResponsavel, setNomeResponsavel] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [nif, setNif] = useState('');
    const [telefone, setTelefone] = useState('');

    useEffect(() => {
        if (tokenURL) {
            setTipoConta('clinica');
            localStorage.setItem('elolab_token_convite', tokenURL);
        }
    }, [tokenURL]);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (tipoConta === 'laboratorio') {
                const payload = { nomeResponsavel, email, senha, nif, telefone, nomeLaboratorio: nomeEmpresa };
                await api.post('/Auth/register/laboratorio', payload);
                notify.success('Laboratório registado com sucesso!');
            } else {
                const payload = { nomeResponsavel, email, senha, nif, telefone, nomeClinica: nomeEmpresa, tokenConvite: tokenURL || null };
                await api.post('/Auth/register/clinica', payload);
                notify.success('Clínica registada com sucesso!');
            }
            setSucesso(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (sucesso) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-300/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

                <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-white max-w-md w-full text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white mb-8 shadow-lg shadow-emerald-500/30 border-4 border-emerald-50">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Conta Criada!</h2>
                    <p className="text-slate-500 mb-10 text-lg leading-relaxed font-medium">
                        {tipoConta === 'laboratorio'
                            ? 'O seu laboratório foi registado com sucesso. Faça login para configurar a sua área.'
                            : 'A sua clínica foi registada. Já pode aceder ao portal e enviar trabalhos!'}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        Aceder à Plataforma
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">

            {/* === FUNDO === */}
            <div className="absolute inset-0 -z-20 bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-40"></div>
            <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[800px] h-[800px] bg-emerald-400/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply"></div>

            <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-700 relative z-10">

                {/* Cabeçalho */}
                <div className="mb-10 text-center">
                    <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-6 shadow-xl shadow-blue-500/30 border border-blue-400/30 hover:scale-105 transition-transform">
                        <span className="font-black text-3xl">EL</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">Criar Conta</h1>
                    <p className="text-slate-600 mt-3 text-lg font-medium">
                        {tokenURL ? 'Preencha os dados para aceitar o convite.' : 'Junte-se ao ecossistema digital EloLab.'}
                    </p>
                </div>

                {/* Cartão Principal */}
                <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-300/50 border border-white relative overflow-hidden">

                    <div className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500 ${!tipoConta ? 'bg-slate-200' : tipoConta === 'laboratorio' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

                    {/* PASSO 1: ESCOLHER O TIPO */}
                    {!tipoConta && !tokenURL && (
                        <div className="space-y-4 animate-in fade-in">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2 text-center">Selecione o seu perfil</h3>

                            <button
                                onClick={() => setTipoConta('laboratorio')}
                                className="w-full flex items-center justify-between p-6 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left shadow-sm hover:shadow-lg hover:shadow-blue-500/10"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex h-16 w-16 items-center justify-center bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all border border-blue-100 group-hover:border-blue-500">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xl mb-1">Laboratório</h3>
                                        <p className="text-sm text-slate-500 font-medium">Receber pedidos e gerir clínicas.</p>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                                </div>
                            </button>

                            <button
                                onClick={() => setTipoConta('clinica')}
                                className="w-full flex items-center justify-between p-6 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group text-left shadow-sm hover:shadow-lg hover:shadow-emerald-500/10"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex h-16 w-16 items-center justify-center bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all border border-emerald-100 group-hover:border-emerald-500">
                                        <Smile className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xl mb-1">Clínica</h3>
                                        <p className="text-sm text-slate-500 font-medium">Enviar trabalhos e acompanhar produção.</p>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* PASSO 2: FORMULÁRIO DE REGISTO */}
                    {tipoConta && (
                        <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-right-8 duration-500 pt-2">

                            <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200/60">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${tipoConta === 'laboratorio' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {tipoConta === 'laboratorio' ? <Building2 className="h-5 w-5" /> : <Smile className="h-5 w-5" />}
                                        </div>
                                        Dados d{tipoConta === 'laboratorio' ? 'o Laboratório' : 'a Clínica'}
                                    </h2>
                                </div>
                                {!tokenURL && (
                                    <button
                                        type="button"
                                        onClick={() => setTipoConta(null)}
                                        className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Mudar
                                    </button>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Nome do Responsável *</label>
                                    <div className="relative group">
                                        <User className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input required type="text" value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="Ex: Dr. João Silva" />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        {tipoConta === 'laboratorio' ? 'Nome do Laboratório *' : 'Nome da Clínica *'}
                                    </label>
                                    <div className="relative group">
                                        {tipoConta === 'laboratorio' ? <Building2 className="absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" /> : <Smile className="absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-600" />}
                                        <input required type="text" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="Ex: Sorriso Perfeito" />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Email de Acesso *</label>
                                    <div className="relative group">
                                        <Mail className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="seu@email.com" />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Senha Segura *</label>
                                    <div className="relative group">
                                        <Lock className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input required type="password" minLength={8} value={senha} onChange={e => setSenha(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="Mínimo 8 caracteres" />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">NIF <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                    <div className="relative group">
                                        <FileText className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input type="text" value={nif} onChange={e => setNif(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Telefone <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                    <div className="relative group">
                                        <Phone className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${
                                    tipoConta === 'laboratorio'
                                        ? 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40'
                                        : 'bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-700 hover:shadow-emerald-500/40'
                                }`}
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Finalizar Registo'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center relative z-10 bg-white/60 backdrop-blur-sm py-4 px-6 rounded-2xl border border-white shadow-sm inline-block mx-auto">
                    <p className="text-slate-600 font-medium">
                        Já tem conta?{' '}
                        <Link to="/login" className="font-bold text-slate-900 hover:text-blue-600 hover:underline transition-colors">
                            Faça login aqui
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}