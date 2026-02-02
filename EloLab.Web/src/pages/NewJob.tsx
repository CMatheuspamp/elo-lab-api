import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Calendar, User, FileText,
    Building2, Palette, ChevronDown, Euro
} from 'lucide-react';
import type { UserSession, Servico } from '../types';

export function NewJob() {
    const navigate = useNavigate();
    const location = useLocation(); // Hook para ler dados vindos da navegação (Cards)

    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserSession | null>(null);

    // Listas de Dados
    const [listaServicos, setListaServicos] = useState<Servico[]>([]);
    const [listaParceiros, setListaParceiros] = useState<any[]>([]); // Labs ou Clínicas

    // Estados do Formulário
    const [paciente, setPaciente] = useState('');
    const [dentes, setDentes] = useState('');
    const [cor, setCor] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [obs, setObs] = useState('');

    // Seleções
    const [parceiroSelecionadoId, setParceiroSelecionadoId] = useState('');
    const [servicoId, setServicoId] = useState('');
    const [valor, setValor] = useState('');

    // 1. Carga Inicial de Usuário e Parceiros
    useEffect(() => {
        carregarDadosIniciais();
    }, []);

    // 2. Monitora mudança do Parceiro para carregar a Tabela de Preços correta
    useEffect(() => {
        if (!user) return;

        // Se sou Clínica e existe um parceiro selecionado (via Card ou Select)
        if (user.tipo === 'Clinica' && parceiroSelecionadoId) {
            setListaServicos([]);
            setServicoId('');
            setValor('');

            api.get(`/Servicos/laboratorio/${parceiroSelecionadoId}`)
                .then(res => setListaServicos(res.data))
                .catch(() => alert("Erro ao carregar tabela de preços deste parceiro."));
        }
    }, [parceiroSelecionadoId, user]);

    async function carregarDadosIniciais() {
        try {
            const resUser = await api.get('/Auth/me');
            const usuarioLogado = resUser.data;
            setUser(usuarioLogado);

            if (usuarioLogado.tipo === 'Laboratorio') {
                // SOU LAB: Carrego meus serviços e meus clientes
                api.get('/Servicos').then(res => setListaServicos(res.data));
                const res = await api.get('/Clinicas');
                setListaParceiros(res.data);
            } else {
                // SOU CLÍNICA: Carrego laboratórios
                const res = await api.get('/Laboratorios');
                setListaParceiros(res.data);

                // VERIFICA SE VEIO UM ID DO CARD DE PARCEIROS
                const preSelectedLabId = location.state?.labId;
                if (preSelectedLabId) {
                    setParceiroSelecionadoId(preSelectedLabId);
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados", error);
            navigate('/dashboard');
        }
    }

    function handleServicoChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const novoId = e.target.value;
        setServicoId(novoId);

        const servicoSelecionado = listaServicos.find(s => s.id === novoId);
        if (servicoSelecionado) {
            setValor(servicoSelecionado.precoBase.toString());
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const payload = {
                // Lógica de quem é quem
                laboratorioId: user.tipo === 'Laboratorio' ? user.meusDados.id : parceiroSelecionadoId,
                clinicaId: user.tipo === 'Laboratorio' ? parceiroSelecionadoId : user.meusDados.id,

                servicoId: servicoId || null,
                pacienteNome: paciente,
                dentes: dentes,
                corDente: cor,
                dataEntrega: new Date(dataEntrega).toISOString(),
                valorPersonalizado: valor ? parseFloat(valor) : null,
                descricaoPersonalizada: obs
            };

            await api.post('/Trabalhos', payload);
            alert('✅ Trabalho criado com sucesso!');

            // Redirecionamento Inteligente
            if (user.tipo === 'Clinica') {
                navigate('/parceiros'); // Volta para a rede
            } else {
                navigate('/dashboard'); // Volta para o painel
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao criar trabalho.');
        } finally {
            setLoading(false);
        }
    }

    const isLab = user?.tipo === 'Laboratorio';

    // Botão Voltar Inteligente
    const handleBack = () => {
        if (isLab) navigate('/dashboard');
        else navigate('/parceiros');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            <div className="mx-auto max-w-3xl">

                <button onClick={handleBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" />
                    {isLab ? 'Voltar ao Dashboard' : 'Voltar aos Parceiros'}
                </button>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 border-b border-slate-100 pb-4">
                        <h1 className="text-2xl font-bold text-slate-900">Novo Pedido</h1>
                        <p className="text-slate-500">Preencha os dados técnicos da produção.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Seção 1: Identificação */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Paciente */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do Paciente</label>
                                <div className="relative">
                                    <User className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                    <input required type="text" value={paciente} onChange={e => setPaciente(e.target.value)}
                                           className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                           placeholder="Ex: Maria Silva" />
                                </div>
                            </div>

                            {/* Parceiro */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-blue-800">
                                    {isLab ? "Clínica (Cliente)" : "Laboratório (Parceiro)"}
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute top-2.5 left-3 h-5 w-5 text-blue-500" />
                                    <select required value={parceiroSelecionadoId} onChange={e => setParceiroSelecionadoId(e.target.value)}
                                            className="w-full appearance-none rounded-lg border border-blue-200 bg-blue-50 py-2.5 pl-10 pr-8 text-sm font-medium text-blue-900 outline-none focus:border-blue-500">
                                        <option value="">
                                            {isLab ? "Selecione a Clínica..." : "Selecione o Laboratório..."}
                                        </option>
                                        {listaParceiros.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Detalhes Técnicos */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                                <FileText className="h-4 w-4"/> Especificações
                            </h3>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Serviço */}
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Serviço (Tabela de Preços)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={servicoId}
                                            onChange={handleServicoChange}
                                            disabled={!parceiroSelecionadoId && !isLab}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                                        >
                                            <option value="">
                                                {!parceiroSelecionadoId && !isLab ? "Selecione um laboratório primeiro..." : "Selecione o serviço..."}
                                            </option>
                                            {listaServicos.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.nome} - {s.material} ({new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.precoBase)})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>

                                {/* Dentes e Cor */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Dentes / Região</label>
                                    <input type="text" value={dentes} onChange={e => setDentes(e.target.value)}
                                           className="w-full rounded-lg border border-slate-200 py-2.5 px-4 outline-none focus:border-blue-500"
                                           placeholder="Ex: 11, 21" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Cor</label>
                                    <div className="relative">
                                        <Palette className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                        <input type="text" value={cor} onChange={e => setCor(e.target.value)}
                                               className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                               placeholder="Ex: A2" />
                                    </div>
                                </div>

                                {/* Data e Valor */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Data de Entrega</label>
                                    <div className="relative">
                                        <Calendar className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                        <input required type="datetime-local" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)}
                                               className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Valor Estimado (€)</label>
                                    <div className="relative">
                                        <Euro className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                        <input type="number" value={valor} onChange={e => setValor(e.target.value)}
                                               className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                               placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Obs */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Observações Adicionais</label>
                            <div className="relative">
                                <FileText className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                <textarea rows={3} value={obs} onChange={e => setObs(e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Criar Pedido</>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}