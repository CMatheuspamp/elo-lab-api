import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import {
    TrendingUp, AlertCircle, Clock, CheckCircle,
    Plus, Search, ArrowLeft, ArrowRight, Calendar
} from 'lucide-react';
import type { Trabalho, Laboratorio } from '../types';

export function PartnerDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [lab, setLab] = useState<Laboratorio | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroMes, setFiltroMes] = useState('');

    // Status Helper
    const getStatusStyle = (status: string) => {
        const s = (status || '').toString().toLowerCase();
        if (s.includes('pendente')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (s.includes('emproducao')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        if (s.includes('concluido')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (s.includes('cancelado')) return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    async function loadData() {
        try {
            const resLabs = await api.get('/Laboratorios');
            const foundLab = resLabs.data.find((l: any) => l.id === id);

            if (foundLab) {
                setLab(foundLab);
                const resTrabalhos = await api.get('/Trabalhos');
                setTrabalhos(resTrabalhos.data.filter((t: Trabalho) => t.laboratorioId === id));
            } else {
                navigate('/parceiros');
            }
        } catch (error) {
            console.error("Erro ao carregar", error);
        } finally {
            setLoading(false);
        }
    }

    const primaryColor = lab?.corPrimaria || '#2563EB';

    // Gradiente reforçado
    const backgroundStyle = {
        background: `linear-gradient(180deg, ${primaryColor}40 0%, #f8fafc 100%)`,
        backgroundColor: '#f8fafc'
    };

    const filtered = trabalhos.filter(t => {
        const matchesText =
            t.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
            (t.servico?.nome || '').toLowerCase().includes(busca.toLowerCase());

        const matchesStatus = filtroStatus === 'Todos' || t.status === filtroStatus;

        let matchesDate = true;
        if (filtroMes) {
            const dataRef = t.dataEntregaPrevista || t.createdAt;
            const mesTrabalho = new Date(dataRef).toISOString().slice(0, 7);
            matchesDate = mesTrabalho === filtroMes;
        }

        return matchesText && matchesStatus && matchesDate;
    });

    const pendentes = filtered.filter(t => t.status === 'Pendente').length;
    const emProducao = filtered.filter(t => t.status === 'EmProducao').length;
    const concluidos = filtered.filter(t => t.status === 'Concluido').length;
    const totalValor = filtered.reduce((acc, t) => acc + t.valorFinal, 0);

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
    const getFullUrl = (url?: string) => url ? (url.startsWith('http') ? url : `${api.defaults.baseURL?.replace('/api', '')}/${url}`) : '';

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-blue-600 rounded-full"></div></div>;
    if (!lab) return null;

    return (
        <div className="min-h-screen p-8 transition-all duration-500" style={backgroundStyle}>

            <div className="mb-6 flex items-center justify-between">
                <button onClick={() => navigate('/parceiros')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> Voltar à Rede
                </button>
            </div>

            {/* Banner */}
            <div className="relative mb-8 overflow-hidden rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {lab.logoUrl ? (
                            <img src={getFullUrl(lab.logoUrl)} className="h-20 w-auto object-contain" />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-md" style={{ backgroundColor: primaryColor }}>
                                {lab.nome.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">{lab.nome}</h1>
                            <p className="mt-1 font-medium text-slate-500 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                Ambiente do Parceiro
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/trabalhos/novo', { state: { labId: lab.id } })}
                        className="flex items-center gap-3 rounded-2xl px-8 py-4 font-bold text-white shadow-lg transition hover:-translate-y-1"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Plus className="h-6 w-6" /> Novo Pedido
                    </button>
                </div>
            </div>

            {/* Stats (Ícones Limpos) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
                {/* Total */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex justify-between items-center group hover:border-slate-300 transition">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Total {filtroMes ? 'no Mês' : 'Geral'}</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-900">{formatMoney(totalValor)}</h3>
                    </div>
                    <div style={{ color: primaryColor }}><TrendingUp className="h-8 w-8" /></div>
                </div>

                {/* Pendentes */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Pendentes</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-900">{pendentes}</h3>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>

                {/* Produção */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Produção</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-900">{emProducao}</h3>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                </div>

                {/* Prontos */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Prontos</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-900">{concluidos}</h3>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
            </div>

            {/* Tabela */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 bg-slate-50/50 p-4 gap-4">
                    {/* Barra de Busca */}
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                        <input value={busca} onChange={e => setBusca(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none bg-white focus:border-blue-300 transition" placeholder="Buscar paciente, serviço..." />
                    </div>

                    {/* Filtros */}
                    <div className="flex w-full md:w-auto gap-3">
                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            className="flex-1 md:flex-none rounded-xl border border-slate-200 bg-white py-2 px-4 text-sm outline-none font-medium text-slate-600 focus:border-blue-300 transition cursor-pointer"
                        >
                            <option value="Todos">Status: Todos</option>
                            <option value="Pendente">Pendente</option>
                            <option value="EmProducao">Em Produção</option>
                            <option value="Concluido">Concluído</option>
                        </select>

                        <input
                            type="month"
                            value={filtroMes}
                            onChange={(e) => setFiltroMes(e.target.value)}
                            className="flex-1 md:flex-none rounded-xl border border-slate-200 bg-white py-2 px-4 text-sm outline-none font-medium text-slate-600 focus:border-blue-300 transition cursor-pointer"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
                    <tr>
                        <th className="px-6 py-4">Paciente</th>
                        <th className="px-6 py-4">Serviço</th>
                        <th className="px-6 py-4">Entrega</th>
                        <th className="px-6 py-4">Valor</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400">
                                Nenhum pedido encontrado com estes filtros.
                            </td>
                        </tr>
                    ) : (
                        filtered.map(t => (
                            <tr key={t.id} onClick={() => navigate(`/trabalhos/${t.id}`)} className="cursor-pointer hover:bg-slate-50 transition">
                                <td className="px-6 py-4 font-bold text-slate-900">{t.pacienteNome}</td>
                                <td className="px-6 py-4">{t.servico?.nome || 'Personalizado'}</td>
                                <td className="px-6 py-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400"/> {new Date(t.dataEntregaPrevista).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-bold">{formatMoney(t.valorFinal)}</td>
                                <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(t.status)}`}>
                                            {t.status}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-right"><ArrowRight className="ml-auto h-4 w-4 text-slate-300"/></td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}