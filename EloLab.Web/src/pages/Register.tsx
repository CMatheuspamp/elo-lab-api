import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { notify } from '../utils/notify';
import {
    Building2, Stethoscope, User, Mail, Lock,
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
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-100 via-white to-emerald-50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-300/20 blur-[100px] rounded-full -z-10"></div>

                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-emerald-500/10 border border-white max-w-md w-full text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white mb-8 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Conta Criada!</h2>
                    <p className="text-slate-500 mb-10 text-lg leading-relaxed">
                        {tipoConta === 'laboratorio'
                            ? 'O seu laboratório foi registado com sucesso. Faça login para configurar a sua área.'
                            : 'A sua clínica foi registada. Já pode aceder ao portal e enviar trabalhos!'}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        Aceder à Plataforma
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">

            {/* === FUNDO COLORIDO E VIBRANTE (Mesh Gradient) === */}
            <div className="absolute inset-0 -z-20 bg-slate-50"></div>

            {/* Mancha Azul (Laboratório) no topo esquerdo */}
            <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[800px] h-[800px] bg-blue-300/30 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

            {/* Mancha Esmeralda (Clínica) no fundo direito */}
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[800px] h-[800px] bg-emerald-300/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

            <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-500 relative z-10">

                {/* Cabeçalho */}
                <div className="mb-10 text-center">
                    <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-6 shadow-xl shadow-blue-500/30 hover:scale-105 transition-transform">
                        <span className="font-black text-2xl">EL</span>
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Criar Conta</h1>
                    <p className="text-slate-600 mt-3 text-lg font-medium">
                        {tokenURL ? 'Preencha os dados para aceitar o convite.' : 'Junte-se ao ecossistema digital EloLab.'}
                    </p>
                </div>

                {/* Cartão Principal com leve transparência para ver as cores de fundo */}
                <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white">

                    {/* PASSO 1: ESCOLHER O TIPO */}
                    {!tipoConta && !tokenURL && (
                        <div className="space-y-4 animate-in fade-in">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 px-2 text-center">Selecione o seu perfil</h3>

                            <button
                                onClick={() => setTipoConta('laboratorio')}
                                className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-transparent bg-white hover:border-blue-500 hover:bg-blue-50/80 transition-all group text-left shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex h-14 w-14 items-center justify-center bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all">
                                        <Building2 className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-xl mb-1">Laboratório</h3>
                                        <p className="text-sm text-slate-500">Receber pedidos e gerir clínicas.</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </button>

                            <button
                                onClick={() => setTipoConta('clinica')}
                                className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-transparent bg-white hover:border-emerald-500 hover:bg-emerald-50/80 transition-all group text-left shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex h-14 w-14 items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all">
                                        <Stethoscope className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-xl mb-1">Clínica</h3>
                                        <p className="text-sm text-slate-500">Enviar trabalhos e acompanhar produção.</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </button>
                        </div>
                    )}

                    {/* PASSO 2: FORMULÁRIO DE REGISTO */}
                    {tipoConta && (
                        <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-right-8 duration-300">

                            {/* Header do Form */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        {tipoConta === 'laboratorio' ? <Building2 className="h-5 w-5 text-blue-600" /> : <Stethoscope className="h-5 w-5 text-emerald-600" />}
                                        Dados d{tipoConta === 'laboratorio' ? 'o Laboratório' : 'a Clínica'}
                                    </h2>
                                </div>
                                {!tokenURL && (
                                    <button
                                        type="button"
                                        onClick={() => setTipoConta(null)}
                                        className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition bg-white/50 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Voltar
                                    </button>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Nome do Responsável *</label>
                                    <div className="relative group">
                                        <User className={`absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input required type="text" value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-base outline-none transition focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="Ex: Dr. João Silva" />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        {tipoConta === 'laboratorio' ? 'Nome do Laboratório *' : 'Nome da Clínica *'}
                                    </label>
                                    <div className="relative group">
                                        {tipoConta === 'laboratorio' ? <Building2 className="absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" /> : <Stethoscope className="absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-600" />}
                                        <input required type="text" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-base outline-none transition focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="Ex: Sorriso Perfeito" />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Email de Acesso *</label>
                                    <div className="relative group">
                                        <Mail className={`absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-base outline-none transition focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="seu@email.com" />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Senha Segura *</label>
                                    <div className="relative group">
                                        <Lock className={`absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input required type="password" minLength={8} value={senha} onChange={e => setSenha(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-base outline-none transition focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} placeholder="Mínimo 8 caracteres" />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">NIF <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                    <div className="relative group">
                                        <FileText className={`absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input type="text" value={nif} onChange={e => setNif(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-base outline-none transition focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Telefone <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                    <div className="relative group">
                                        <Phone className={`absolute top-3 left-3.5 h-5 w-5 text-slate-400 transition-colors ${tipoConta === 'laboratorio' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-emerald-600'}`} />
                                        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-base outline-none transition focus:bg-white focus:ring-4 shadow-sm ${tipoConta === 'laboratorio' ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-emerald-600 focus:ring-emerald-600/10'}`} />
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

                <div className="mt-8 text-center relative z-10">
                    <p className="text-slate-500 font-medium">
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