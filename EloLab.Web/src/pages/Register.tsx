import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { notify } from '../utils/notify';
import {
    Building2, Stethoscope, User, Mail, Lock,
    Phone, FileText, Loader2, ArrowLeft, CheckCircle2
} from 'lucide-react';

export function Register() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // O React vai procurar se existe um ?token= na URL
    const tokenURL = searchParams.get('token');

    const [tipoConta, setTipoConta] = useState<'laboratorio' | 'clinica' | null>(null);
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    // Campos do Formulário
    const [nomeResponsavel, setNomeResponsavel] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nomeEmpresa, setNomeEmpresa] = useState(''); // Serve para NomeLaboratorio ou NomeClinica
    const [nif, setNif] = useState('');
    const [telefone, setTelefone] = useState('');

    useEffect(() => {
        // Se houver um token na URL, assumimos automaticamente que é uma Clínica a ser convidada
        if (tokenURL) {
            setTipoConta('clinica');
            // Guarda o token no localStorage para a "mágica" do login caso ela decida fazer login em vez de registar
            localStorage.setItem('elolab_token_convite', tokenURL);
        }
    }, [tokenURL]);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (tipoConta === 'laboratorio') {
                const payload = {
                    nomeResponsavel, email, senha, nif, telefone,
                    nomeLaboratorio: nomeEmpresa // O backend espera NomeLaboratorio
                };
                await api.post('/Auth/register/laboratorio', payload);
                notify.success('Laboratório registado com sucesso!');
            } else {
                const payload = {
                    nomeResponsavel, email, senha, nif, telefone,
                    nomeClinica: nomeEmpresa, // O backend espera NomeClinica
                    tokenConvite: tokenURL || null // Se tiver token, envia para fazer o vínculo!
                };
                await api.post('/Auth/register/clinica', payload);
                notify.success('Clínica registada com sucesso!');
            }

            // Em vez de ir direto para login, mostramos uma mensagem de sucesso
            setSucesso(true);

        } catch (error) {
            // O interceptor do axios já mostra a notificação de erro
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // TELA DE SUCESSO
    if (sucesso) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Conta Criada!</h2>
                    <p className="text-slate-500 mb-8">
                        {tipoConta === 'laboratorio'
                            ? 'O seu laboratório foi registado com sucesso. Faça login para aceder ao sistema.'
                            : 'A sua clínica foi registada. Já pode enviar trabalhos para o laboratório!'}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        Ir para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">

            {/* Cabeçalho simples (Logo) */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-200">
                    <span className="font-black text-xl">EL</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900">Crie a sua conta</h1>
                <p className="text-slate-500 mt-2">
                    {tokenURL ? 'Foi convidado para aderir ao EloLab.' : 'Junte-se à plataforma número 1 de próteses.'}
                </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">

                {/* PASSO 1: ESCOLHER O TIPO (Só aparece se NÃO houver token e não tiver escolhido ainda) */}
                {!tipoConta && !tokenURL && (
                    <div className="space-y-4 animate-in fade-in">
                        <button
                            onClick={() => setTipoConta('laboratorio')}
                            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition group text-left"
                        >
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Sou um Laboratório</h3>
                                <p className="text-sm text-slate-500">Quero gerir clínicas e receber pedidos.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setTipoConta('clinica')}
                            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition group text-left"
                        >
                            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                <Stethoscope className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Sou uma Clínica</h3>
                                <p className="text-sm text-slate-500">Quero enviar pedidos de próteses.</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* PASSO 2: FORMULÁRIO DE REGISTO */}
                {tipoConta && (
                    <form onSubmit={handleRegister} className="space-y-4 animate-in slide-in-from-right-4 duration-300">

                        {!tokenURL && (
                            <button
                                type="button"
                                onClick={() => setTipoConta(null)}
                                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 font-medium transition"
                            >
                                <ArrowLeft className="h-4 w-4" /> Voltar
                            </button>
                        )}

                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Nome do Responsável *</label>
                            <div className="relative">
                                <User className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input required type="text" value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="Ex: Dr. João Silva" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">
                                {tipoConta === 'laboratorio' ? 'Nome do Laboratório *' : 'Nome da Clínica *'}
                            </label>
                            <div className="relative">
                                {tipoConta === 'laboratorio' ? <Building2 className="absolute top-3 left-3 h-4 w-4 text-slate-400" /> : <Stethoscope className="absolute top-3 left-3 h-4 w-4 text-slate-400" />}
                                <input required type="text" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="Ex: Sorriso Perfeito" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Email *</label>
                            <div className="relative">
                                <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="seu@email.com" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Senha *</label>
                            <div className="relative">
                                <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input required type="password" minLength={8} value={senha} onChange={e => setSenha(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition" placeholder="Mínimo 8 caracteres" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">NIF</label>
                                <div className="relative">
                                    <FileText className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                    <input type="text" value={nif} onChange={e => setNif(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                    <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition" />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50 ${tipoConta === 'laboratorio' ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'}`}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar Conta'}
                        </button>
                    </form>
                )}
            </div>

            <p className="mt-8 text-sm text-slate-500">
                Já tem conta? <Link to="/login" className="font-bold text-blue-600 hover:underline">Faça login aqui</Link>
            </p>
        </div>
    );
}