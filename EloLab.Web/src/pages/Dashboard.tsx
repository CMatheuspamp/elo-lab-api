import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, AlertCircle, Clock, CheckCircle,
    DollarSign, Filter, Search, Plus, Calendar, ArrowRight
} from 'lucide-react';
import type { UserSession, Trabalho } from '../types';

export function Dashboard() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // === WHITE LABEL ===
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';
    const logoUrl = localStorage.getItem('elolab_user_logo');
    // ===================

    // Filtros
    const [parceiroSelecionadoId, setParceiroSelecionadoId] = useState('Todos'); // Renomeado para clareza, mas mantendo lógica
    const [parceirosParaFiltro, setParceirosParaFiltro] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroMes, setFiltroMes] = useState('');

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

    // Helper URL Imagem
    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanPath}`;
    };

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

                const trabalhosResponse = await api.get('/Trabalhos');
                setTrabalhos(trabalhosResponse.data);

                let urlParceiros = userData.tipo === 'Laboratorio' ? '/Clinicas' : '/Laboratorios';
                const parceirosRes = await api.get(urlParceiros);
                setParceirosParaFiltro(parceirosRes.data);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    function limparFiltros() {
        setBusca('');
        setFiltroStatus('Todos');
        setParceiroSelecionadoId('Todos');
        setFiltroMes('');
    }

    const isLab = user?.tipo === 'Laboratorio';

    // === LÓGICA DE FILTRAGEM ===
    const trabalhosFiltrados = trabalhos.filter(t => {
        // 1. Busca Texto
        const textoMatch =
            t.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
            t.id.toLowerCase().includes(busca.toLowerCase()) ||
            (t.servico?.nome || '').toLowerCase().includes(busca.toLowerCase());

        // 2. Status
        const statusMatch = filtroStatus === 'Todos' || t.status === filtroStatus;

        // 3. Parceiro (Clínica ou Lab)
        const idParceiroNoTrabalho = isLab ? t.clinicaId : t.laboratorioId;
        const parceiroMatch = parceiroSelecionadoId === 'Todos' || idParceiroNoTrabalho === parceiroSelecionadoId;

        // 4. Data (Mês)
        let dataMatch = true;
        if (filtroMes) {
            // Compara o ano-mês de criação (ou entrega, se preferires)
            const mesTrabalho = new Date(t.createdAt).toISOString().slice(0, 7);
            dataMatch = mesTrabalho === filtroMes;
        }

        return textoMatch && statusMatch && parceiroMatch && dataMatch;
    });

    // === CÁLCULOS DINÂMICOS (Baseados no Filtro) ===
    // Antes usávamos 'trabalhos.', agora usamos 'trabalhosFiltrados.'
    const pendentes = trabalhosFiltrados.filter(t => t.status === 'Pendente').length;
    const emProducao = trabalhosFiltrados.filter(t => t.status === 'EmProducao').length;
    const concluidos = trabalhosFiltrados.filter(t => t.status === 'Concluido').length;

    // Soma apenas o que está visível na tabela
    const totalValor = trabalhosFiltrados.reduce((acc, t) => acc + t.valorFinal, 0);

    if (loading || !user) return <div className="p-8 text-slate-400">Carregando...</div>;

    return (
        <div className="p-8 space-y-8">

            {/* === BANNER INSTITUCIONAL === */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {logoUrl ? (
                            <img src={getFullUrl(logoUrl)} alt="Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
                        ) : (
                            <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-slate-200"
                                 style={{ backgroundColor: primaryColor }}>
                                {user.meusDados.nome.charAt(0)}
                            </div>
                        )}

                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                                {user.meusDados.nome}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block h-2 w-2 rounded-full animate-pulse bg-green-500"></span>
                                <p className="text-slate-500 font-medium text-sm uppercase tracking-wide">
                                    {isLab ? 'Ambiente de Gestão & Produção' : 'Portal do Parceiro'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/trabalhos/novo')}
                        className="group flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                        style={{ backgroundColor: primaryColor, boxShadow: `0 10px 30px -10px ${primaryColor}` }}
                    >
                        <div className="rounded-full bg-white/20 p-1 group-hover:bg-white/30 transition">
                            <Plus className="h-6 w-6" />
                        </div>
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Cards de Estatística (AGORA DINÂMICOS) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-slate-200 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            {/* Texto muda para indicar que é um filtro */}
                            <p className="text-xs font-bold uppercase text-slate-400">
                                {busca || filtroStatus !== 'Todos' || filtroMes ? 'Faturamento (Filtrado)' : 'Faturamento Total'}
                            </p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalValor)}</h3>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                            {isLab ? <TrendingUp className="h-6 w-6" /> : <DollarSign className="h-6 w-6" />}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: primaryColor }}></div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div><p className="text-xs font-bold uppercase text-slate-400">{isLab ? 'Novos' : 'Aguardando'}</p><h3 className="mt-2 text-2xl font-black text-slate-900">{pendentes}</h3></div>
                        <div className="rounded-xl bg-orange-50 p-3 text-orange-500"><AlertCircle className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div><p className="text-xs font-bold uppercase text-slate-400">Em Produção</p><h3 className="mt-2 text-2xl font-black text-slate-900">{emProducao}</h3></div>
                        <div className="rounded-xl bg-purple-50 p-3 text-purple-500"><Clock className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div><p className="text-xs font-bold uppercase text-slate-400">{isLab ? 'Concluídos' : 'Prontos'}</p><h3 className="mt-2 text-2xl font-black text-slate-900">{concluidos}</h3></div>
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-500"><CheckCircle className="h-6 w-6" /></div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Filter className="h-4 w-4" /> Filtros Avançados
                    </h3>
                    <button onClick={limparFiltros} className="text-xs font-medium hover:underline" style={{ color: primaryColor }}>
                        Limpar Filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Buscar</label>
                        <div className="relative">
                            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                            <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
                                   className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:bg-white transition"
                                   style={{ borderColor: 'transparent', boxShadow: '0 0 0 1px #e2e8f0' }}
                                   onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${primaryColor}`}
                                   onBlur={(e) => e.target.style.boxShadow = '0 0 0 1px #e2e8f0'}
                                   placeholder="Paciente, Serviço ou ID..." />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Status</label>
                        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:bg-white transition">
                            <option value="Todos">Todos</option>
                            <option value="Pendente">Pendente</option>
                            <option value="EmProducao">Em Produção</option>
                            <option value="Concluido">Concluído</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">{isLab ? 'Clínica' : 'Laboratório'}</label>
                        <select value={parceiroSelecionadoId} onChange={e => setParceiroSelecionadoId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:bg-white transition">
                            <option value="Todos">Todos</option>
                            {parceirosParaFiltro.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Mês</label>
                        <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                               className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:bg-white transition"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-500">Resultados da Busca</span>
                    <span className="text-xs font-semibold text-slate-400">{trabalhosFiltrados.length} pedidos encontrados</span>
                </div>

                {trabalhosFiltrados.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <p>Nenhum trabalho encontrado com estes filtros.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Paciente</th>
                            <th className="px-6 py-4">Serviço</th>
                            <th className="px-6 py-4">Parceiro</th>
                            <th className="px-6 py-4">Entrega</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {trabalhosFiltrados.map((trabalho) => (
                            <tr key={trabalho.id} className="hover:bg-slate-50 transition cursor-pointer group" onClick={() => navigate(`/trabalhos/${trabalho.id}`)}>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-slate-900 block">{trabalho.pacienteNome}</span>
                                    <span className="text-xs text-slate-400 font-mono">#{trabalho.id.substring(0, 8)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-700">{trabalho.servico?.nome || 'Personalizado'}</div>
                                    <div className="text-xs text-slate-500">{trabalho.dentes ? `Dentes: ${trabalho.dentes}` : ''}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                                            {(isLab ? trabalho.clinica?.nome : trabalho.laboratorio?.nome)?.charAt(0)}
                                        </div>
                                        <span className="font-medium">{isLab ? trabalho.clinica?.nome : trabalho.laboratorio?.nome}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {formatDate(trabalho.dataEntregaPrevista)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(trabalho.valorFinal)}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusColor(trabalho.status)}`}>{trabalho.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-slate-600 transition" />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}