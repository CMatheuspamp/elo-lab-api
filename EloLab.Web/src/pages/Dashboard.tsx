import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, AlertCircle, Clock, CheckCircle,
    Filter, Search, Plus, Calendar, ArrowRight
} from 'lucide-react';
import type { UserSession, Trabalho } from '../types';

export function Dashboard() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // === WHITE LABEL (Cor do próprio Lab) ===
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';
    const logoUrl = localStorage.getItem('elolab_user_logo');

    // Gradiente de Fundo
    const backgroundStyle = {
        background: `linear-gradient(180deg, ${primaryColor}40 0%, #f8fafc 100%)`,
        backgroundColor: '#f8fafc'
    };

    // Filtros
    const [clinicaSelecionadaId, setClinicaSelecionadaId] = useState('Todos');
    const [clinicasParaFiltro, setClinicasParaFiltro] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroMes, setFiltroMes] = useState('');

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanPath}`;
    };

    const getStatusInfo = (status: string) => {
        const s = (status || '').toString().toLowerCase();
        if (s.includes('pendente')) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle, label: 'Pendente' };
        if (s.includes('producao') || s.includes('emproducao')) return { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Clock, label: 'Em Produção' };
        if (s.includes('concluido') || s.includes('finalizado')) return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Concluído' };
        return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock, label: status };
    };

    useEffect(() => {
        async function loadData() {
            try {
                const meResponse = await api.get('/Auth/me');
                const userData = meResponse.data;

                // 🚨 SEGURANÇA: Se for Clínica, sai daqui imediatamente!
                if (userData.tipo === 'Clinica') {
                    navigate('/parceiros');
                    return;
                }

                setUser(userData);

                // Carrega trabalhos do Laboratório
                const trabalhosResponse = await api.get('/Trabalhos');
                setTrabalhos(trabalhosResponse.data);

                // Carrega apenas as clínicas parceiras para o filtro
                const clinicasRes = await api.get('/Clinicas');
                setClinicasParaFiltro(clinicasRes.data);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [navigate]);

    function limparFiltros() {
        setBusca('');
        setFiltroStatus('Todos');
        setClinicaSelecionadaId('Todos');
        setFiltroMes('');
    }

    const trabalhosFiltrados = trabalhos.filter(t => {
        const textoMatch =
            t.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
            t.id.toLowerCase().includes(busca.toLowerCase()) ||
            (t.servico?.nome || '').toLowerCase().includes(busca.toLowerCase());

        const statusMatch = filtroStatus === 'Todos' || t.status === filtroStatus;

        // Filtro específico para selecionar clínica parceira
        const clinicaMatch = clinicaSelecionadaId === 'Todos' || t.clinicaId === clinicaSelecionadaId;

        let dataMatch = true;
        if (filtroMes) {
            const dataRef = t.dataEntregaPrevista || t.createdAt;
            const mesTrabalho = new Date(dataRef).toISOString().slice(0, 7);
            dataMatch = mesTrabalho === filtroMes;
        }

        return textoMatch && statusMatch && clinicaMatch && dataMatch;
    });

    const pendentes = trabalhosFiltrados.filter(t => t.status === 'Pendente').length;
    const emProducao = trabalhosFiltrados.filter(t => t.status === 'EmProducao').length;
    const concluidos = trabalhosFiltrados.filter(t => t.status === 'Concluido').length;
    const totalValor = trabalhosFiltrados.reduce((acc, t) => acc + t.valorFinal, 0);

    if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-800 rounded-full"></div></div>;

    return (
        <div className="min-h-screen p-8 space-y-8 transition-all duration-500" style={backgroundStyle}>

            {/* Banner */}
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
                                    Ambiente de Gestão & Produção
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/trabalhos/novo')}
                        className="group flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                        style={{ backgroundColor: primaryColor, boxShadow: `0 10px 30px -10px ${primaryColor}60` }}
                    >
                        <div className="rounded-full bg-white/20 p-1 group-hover:bg-white/30 transition">
                            <Plus className="h-6 w-6" />
                        </div>
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Cards de Estatística */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-slate-200 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400">
                                {busca || filtroStatus !== 'Todos' || filtroMes ? 'Faturamento (Filtrado)' : 'Faturamento Total'}
                            </p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalValor)}</h3>
                        </div>
                        <div style={{ color: primaryColor }}><TrendingUp className="h-8 w-8" /></div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: primaryColor }}></div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Novos</p>
                        <h3 className="mt-2 text-2xl font-black text-slate-900">{pendentes}</h3>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Em Produção</p>
                        <h3 className="mt-2 text-2xl font-black text-slate-900">{emProducao}</h3>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Concluídos</p>
                        <h3 className="mt-2 text-2xl font-black text-slate-900">{concluidos}</h3>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
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
                        <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Clínica</label>
                        <select value={clinicaSelecionadaId} onChange={e => setClinicaSelecionadaId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:bg-white transition">
                            <option value="Todos">Todas</option>
                            {clinicasParaFiltro.map((p: any) => (
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
                            <th className="px-6 py-4">Clínica</th>
                            <th className="px-6 py-4">Entrega</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {trabalhosFiltrados.map((trabalho) => {
                            const statusInfo = getStatusInfo(trabalho.status);
                            return (
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
                                                {trabalho.clinica?.nome?.charAt(0)}
                                            </div>
                                            <span className="font-medium">{trabalho.clinica?.nome}</span>
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
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusInfo.color}`}>
                                            <statusInfo.icon className="h-3 w-3" />
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:text-slate-600 transition" />
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}