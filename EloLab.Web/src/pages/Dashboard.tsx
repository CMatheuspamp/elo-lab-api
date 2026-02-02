import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Building2, Calendar, Search, Plus, Tag,
    TrendingUp, AlertCircle, Clock, CheckCircle,
    DollarSign, Filter
} from 'lucide-react';
import type { UserSession, Trabalho } from '../types';

export function Dashboard() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // === ESTADOS PARA FILTROS ===
    const [parceirosParaFiltro, setParceirosParaFiltro] = useState<any[]>([]);

    // Inputs de Filtro
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroParceiro, setFiltroParceiro] = useState('Todos');

    // MUDANÇA: Substituímos Início/Fim por Mês/Ano
    const [filtroMes, setFiltroMes] = useState(''); // Formato: "YYYY-MM"

    // Funções auxiliares
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'EmProducao': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Concluido': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    useEffect(() => {
        async function loadData() {
            try {
                const meResponse = await api.get('/Auth/me');
                const userData = meResponse.data;
                setUser(userData);

                // 1. Carregar Trabalhos
                const trabalhosResponse = await api.get('/Trabalhos');
                setTrabalhos(trabalhosResponse.data);

                // 2. Carregar Lista de Parceiros para o Filtro
                let urlParceiros = '';
                if (userData.tipo === 'Laboratorio') urlParceiros = '/Clinicas';
                else urlParceiros = '/Laboratorios';

                const parceirosRes = await api.get(urlParceiros);
                setParceirosParaFiltro(parceirosRes.data);

            } catch (error) {
                navigate('/');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [navigate]);

    function handleLogout() {
        localStorage.removeItem('elolab_token');
        navigate('/');
    }

    function limparFiltros() {
        setBusca('');
        setFiltroStatus('Todos');
        setFiltroParceiro('Todos');
        setFiltroMes(''); // Limpa o mês
    }

    const isLab = user?.tipo === 'Laboratorio';

    // === LÓGICA DE FILTRAGEM ATUALIZADA ===
    const trabalhosFiltrados = trabalhos.filter(t => {
        // 1. Filtro por Texto
        const textoMatch =
            t.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
            t.id.toLowerCase().includes(busca.toLowerCase()) ||
            (t.servico?.nome || '').toLowerCase().includes(busca.toLowerCase());

        // 2. Filtro por Status
        const statusMatch = filtroStatus === 'Todos' || t.status === filtroStatus;

        // 3. Filtro por Parceiro
        const idParceiroNoTrabalho = isLab ? t.clinicaId : t.laboratorioId;
        const parceiroMatch = filtroParceiro === 'Todos' || idParceiroNoTrabalho === filtroParceiro;

        // 4. Filtro por Mês/Ano (NOVO)
        let dataMatch = true;
        if (filtroMes) {
            // filtroMes vem como "2026-02"
            // t.createdAt vem como "2026-02-02T10:00:00"
            // Cortamos os primeiros 7 caracteres da data do trabalho para comparar
            const mesTrabalho = new Date(t.createdAt).toISOString().slice(0, 7);
            dataMatch = mesTrabalho === filtroMes;
        }

        return textoMatch && statusMatch && parceiroMatch && dataMatch;
    });

    // Cálculos para os Cards (Baseados nos dados TOTAIS)
    const pendentes = trabalhos.filter(t => t.status === 'Pendente').length;
    const emProducao = trabalhos.filter(t => t.status === 'EmProducao').length;
    const concluidos = trabalhos.filter(t => t.status === 'Concluido').length;
    const totalValor = trabalhos.reduce((acc, t) => acc + t.valorFinal, 0);

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center text-slate-400">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* Header Fixo */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">E</div>
                        <span className="text-lg font-bold text-slate-800">EloLab</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {!isLab && (
                            <button onClick={() => navigate('/parceiros')} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                                <Building2 className="h-3.5 w-3.5" /> Rede de Parceiros
                            </button>
                        )}
                        {isLab && (
                            <button onClick={() => navigate('/servicos')} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                                <Tag className="h-3.5 w-3.5" /> Tabela de Preços
                            </button>
                        )}
                        <div className="text-right cursor-pointer hover:opacity-80 transition group" onClick={() => navigate('/perfil')} title="Editar Perfil">
                            <p className="text-sm font-semibold text-slate-900">{user.meusDados.nome}</p>
                            <p className="text-xs text-slate-500 group-hover:text-blue-600 group-hover:underline">Meu Perfil</p>
                        </div>
                        <button onClick={handleLogout} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto mt-8 max-w-6xl px-6">

                {/* Título e Ação */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Trabalhos</h1>
                        <p className="text-slate-500">{isLab ? 'Visão geral da produção' : 'Acompanhe seus pedidos'}</p>
                    </div>
                    <button onClick={() => navigate('/trabalhos/novo')} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition">
                        <Plus className="h-4 w-4" /> Novo Pedido
                    </button>
                </div>

                {/* Cards de Estatística */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">{isLab ? 'Faturamento Total' : 'Total em Pedidos'}</p>
                                <h3 className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalValor)}</h3>
                            </div>
                            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                                {isLab ? <TrendingUp className="h-6 w-6" /> : <DollarSign className="h-6 w-6" />}
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div><p className="text-xs font-bold uppercase text-slate-400">{isLab ? 'Novos Pedidos' : 'Aguardando'}</p><h3 className="mt-2 text-2xl font-bold text-slate-900">{pendentes}</h3></div>
                            <div className="rounded-full bg-orange-50 p-3 text-orange-600"><AlertCircle className="h-6 w-6" /></div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div><p className="text-xs font-bold uppercase text-slate-400">Em Produção</p><h3 className="mt-2 text-2xl font-bold text-slate-900">{emProducao}</h3></div>
                            <div className="rounded-full bg-purple-50 p-3 text-purple-600"><Clock className="h-6 w-6" /></div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div><p className="text-xs font-bold uppercase text-slate-400">{isLab ? 'Concluídos' : 'Prontos'}</p><h3 className="mt-2 text-2xl font-bold text-slate-900">{concluidos}</h3></div>
                            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600"><CheckCircle className="h-6 w-6" /></div>
                        </div>
                    </div>
                </div>

                {/* === ÁREA DE FILTROS AVANÇADOS === */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Filter className="h-4 w-4" /> Filtros Avançados
                        </h3>
                        <button onClick={limparFiltros} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                            Limpar Filtros
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

                        {/* 1. Busca Texto (2 Colunas) */}
                        <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-500">Buscar</label>
                            <div className="relative">
                                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
                                       className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
                                       placeholder="Paciente, Serviço ou ID..." />
                            </div>
                        </div>

                        {/* 2. Status (1 Coluna) */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500">Status</label>
                            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-blue-500">
                                <option value="Todos">Todos</option>
                                <option value="Pendente">Pendente</option>
                                <option value="EmProducao">Em Produção</option>
                                <option value="Concluido">Concluído</option>
                            </select>
                        </div>

                        {/* 3. Parceiro (1 Coluna) */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500">{isLab ? 'Clínica' : 'Laboratório'}</label>
                            <select value={filtroParceiro} onChange={e => setFiltroParceiro(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-blue-500">
                                <option value="Todos">Todos</option>
                                {parceirosParaFiltro.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* 4. Mês de Referência (1 Coluna - CORRIGIDO) */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500">Mês de Referência</label>
                            {/* type="month" cria o seletor de Mês e Ano nativo do navegador */}
                            <input
                                type="month"
                                value={filtroMes}
                                onChange={e => setFiltroMes(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                    </div>
                </div>

                {/* Tabela de Trabalhos */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-slate-500">Resultados da Busca</span>
                        <span className="text-xs font-semibold text-slate-400">{trabalhosFiltrados.length} encontrados</span>
                    </div>

                    {trabalhosFiltrados.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <p>Nenhum trabalho encontrado com estes filtros.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Paciente</th>
                                <th className="px-6 py-4">Serviço / Detalhes</th>
                                <th className="px-6 py-4">Parceiro</th>
                                <th className="px-6 py-4">Entrega</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {trabalhosFiltrados.map((trabalho) => (
                                <tr key={trabalho.id} className="hover:bg-slate-50/80 transition">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {trabalho.pacienteNome}
                                        <span className="block text-xs font-normal text-slate-400">ID: {trabalho.id.substring(0, 8)}...</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{trabalho.servico?.nome || 'Personalizado'}</div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            {trabalho.dentes ? `Dentes: ${trabalho.dentes}` : 'Sem dentes espec.'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            {isLab ? trabalho.clinica?.nome : trabalho.laboratorio?.nome}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {formatDate(trabalho.dataEntregaPrevista)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{formatCurrency(trabalho.valorFinal)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(trabalho.status)}`}>{trabalho.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => navigate(`/trabalhos/${trabalho.id}`)} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">Ver</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}