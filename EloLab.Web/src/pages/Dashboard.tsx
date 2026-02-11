import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { notify } from '../utils/notify';
import {
    TrendingUp, AlertCircle, Clock, CheckCircle,
    Filter, Search, Plus, Calendar, ArrowRight, Trash2, ArrowLeft, Wallet, BookOpen, X, Info
} from 'lucide-react';
import type { UserSession, Trabalho, Servico } from '../types';
import { PageContainer } from '../components/PageContainer';

export function Dashboard() {
    const navigate = useNavigate();
    const { labId } = useParams();

    const [user, setUser] = useState<UserSession | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [labInfo, setLabInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showCatalogue, setShowCatalogue] = useState(false);
    const [catalogoServicos, setCatalogoServicos] = useState<Servico[]>([]);
    const [servicoDetalhe, setServicoDetalhe] = useState<Servico | null>(null);

    const [clinicaSelecionadaId, setClinicaSelecionadaId] = useState('Todos');
    const [clinicasParaFiltro, setClinicasParaFiltro] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroMes, setFiltroMes] = useState('');

    // === NOVO ESTADO: MODAL DE CONFIRMAÇÃO ===
    const [trabalhoParaExcluir, setTrabalhoParaExcluir] = useState<string | null>(null);

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
                setUser(userData);

                const isClinica = userData.tipo === 'Clinica';

                if (isClinica && !labId) {
                    navigate('/parceiros');
                    return;
                }

                const trabalhosResponse = await api.get('/Trabalhos');
                let lista = trabalhosResponse.data;

                if (isClinica && labId) {
                    lista = lista.filter((t: Trabalho) => t.laboratorioId === labId);

                    const labsRes = await api.get('/Laboratorios');
                    const currentLab = labsRes.data.find((l: any) => l.id === labId);
                    if (currentLab) setLabInfo(currentLab);

                    const servicosRes = await api.get(`/Servicos/laboratorio/${labId}`);
                    setCatalogoServicos(servicosRes.data);

                } else {
                    const clinicasRes = await api.get('/Clinicas');
                    setClinicasParaFiltro(clinicasRes.data);
                }

                setTrabalhos(lista);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [navigate, labId]);

    // === NOVA FUNÇÃO DE EXCLUSÃO (Com Modal) ===
    async function confirmarExclusao() {
        if (!trabalhoParaExcluir) return;
        try {
            await api.delete(`/Trabalhos/${trabalhoParaExcluir}`);
            setTrabalhos(prev => prev.filter(t => t.id !== trabalhoParaExcluir));
            notify.success("Trabalho excluído com sucesso.");
        } catch (error) {
            // interceptor cuida
        } finally {
            setTrabalhoParaExcluir(null);
        }
    }

    function limparFiltros() {
        setBusca('');
        setFiltroStatus('Todos');
        setClinicaSelecionadaId('Todos');
        setFiltroMes('');
    }

    if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-800 rounded-full"></div></div>;

    const isClinica = user.tipo === 'Clinica';
    const primaryColor = labInfo ? (labInfo.corPrimaria || '#2563EB') : (localStorage.getItem('elolab_user_color') || '#2563EB');
    const logoUrl = labInfo ? labInfo.logoUrl : localStorage.getItem('elolab_user_logo');
    const displayName = labInfo ? labInfo.nome : user.meusDados.nome;
    const displaySubtitle = isClinica ? 'Portal do Parceiro' : 'Ambiente de Gestão & Produção';
    const labelFinanceiro = isClinica ? 'Total Investido' : 'Faturamento';
    const labelNovos = isClinica ? 'Pendentes' : 'Novos Pedidos';
    const IconFinanceiro = isClinica ? Wallet : TrendingUp;

    const trabalhosFiltrados = trabalhos.filter(t => {
        const textoMatch = t.pacienteNome.toLowerCase().includes(busca.toLowerCase()) || t.id.toLowerCase().includes(busca.toLowerCase()) || (t.servico?.nome || '').toLowerCase().includes(busca.toLowerCase());
        const statusMatch = filtroStatus === 'Todos' || t.status === filtroStatus;
        const clinicaMatch = clinicaSelecionadaId === 'Todos' || t.clinicaId === clinicaSelecionadaId;
        let dataMatch = true;
        if (filtroMes) {
            const dataRef = t.dataEntregaPrevista || t.createdAt;
            dataMatch = new Date(dataRef).toISOString().slice(0, 7) === filtroMes;
        }
        return textoMatch && statusMatch && clinicaMatch && dataMatch;
    });

    const pendentes = trabalhosFiltrados.filter(t => t.status === 'Pendente').length;
    const emProducao = trabalhosFiltrados.filter(t => t.status === 'EmProducao').length;
    const concluidos = trabalhosFiltrados.filter(t => t.status === 'Concluido').length;
    const totalValor = trabalhosFiltrados.reduce((acc, t) => acc + t.valorFinal, 0);

    return (
        <PageContainer primaryColor={primaryColor}>

            {/* === MODAL DE CONFIRMAÇÃO DE EXCLUSÃO === */}
            {trabalhoParaExcluir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Trabalho?</h3>
                        <p className="text-sm text-slate-500 mb-6">Esta ação não pode ser desfeita. Todos os ficheiros e mensagens associadas serão apagados.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setTrabalhoParaExcluir(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 hover:bg-slate-200 transition">Cancelar</button>
                            <button onClick={confirmarExclusao} className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 transition">Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === CATÁLOGO MODAL === */}
            {showCatalogue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl h-[85vh] bg-slate-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Catálogo de Serviços</h2>
                                <p className="text-slate-500 text-sm">Explore os serviços e materiais disponíveis.</p>
                            </div>
                            <button onClick={() => { setShowCatalogue(false); setServicoDetalhe(null); }} className="rounded-full p-2 hover:bg-slate-100 transition">
                                <X className="h-6 w-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {catalogoServicos.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => setServicoDetalhe(s)}
                                        className="group cursor-pointer bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                                    >
                                        <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                                            {s.fotoUrl ? (
                                                <img src={getFullUrl(s.fotoUrl)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" alt={s.nome} />
                                            ) : (
                                                <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                                                    <Info className="h-10 w-10 mb-2 opacity-50" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Sem Imagem</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                                                {s.material || 'Geral'}
                                            </div>
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600 transition">{s.nome}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                                <Clock className="h-3 w-3" /> {s.prazoDiasUteis} dias úteis
                                            </div>
                                            <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                                                <span className="text-xl font-black text-slate-900">{formatCurrency(s.precoBase)}</span>
                                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition">Ver Detalhes</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {servicoDetalhe && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in zoom-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row max-h-[80vh]">
                                <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 relative">
                                    {servicoDetalhe.fotoUrl ? (
                                        <img src={getFullUrl(servicoDetalhe.fotoUrl)} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-300"><Info className="h-12 w-12"/></div>
                                    )}
                                </div>
                                <div className="p-8 md:w-1/2 flex flex-col">
                                    <button onClick={(e) => { e.stopPropagation(); setServicoDetalhe(null); }} className="self-end mb-4 text-slate-400 hover:text-slate-600"><X className="h-6 w-6"/></button>
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">{servicoDetalhe.material}</span>
                                    <h2 className="text-3xl font-bold text-slate-900 mb-4">{servicoDetalhe.nome}</h2>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Prazo de Entrega</span>
                                            <span className="font-bold text-slate-900 flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400"/> {servicoDetalhe.prazoDiasUteis} dias</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Valor Estimado</span>
                                            <span className="text-2xl font-black text-slate-900">{formatCurrency(servicoDetalhe.precoBase)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setServicoDetalhe(null);
                                            setShowCatalogue(false);
                                            navigate('/trabalhos/novo', {
                                                state: {
                                                    preSelectedLabId: labId,
                                                    preSelectedLabColor: primaryColor,
                                                    preSelectedServiceId: servicoDetalhe.id
                                                }
                                            });
                                        }}
                                        className="mt-auto w-full py-4 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition text-center"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Solicitar este Serviço
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isClinica && labId && (
                <button onClick={() => navigate('/parceiros')} className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> Voltar para Meus Laboratórios
                </button>
            )}

            <div className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            {logoUrl ? (
                                <img src={getFullUrl(logoUrl)} alt="Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
                            ) : (
                                <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-slate-200"
                                     style={{ backgroundColor: primaryColor }}>
                                    {displayName.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                                    {displayName}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-block h-2 w-2 rounded-full animate-pulse bg-green-500"></span>
                                    <p className="text-slate-500 font-medium text-sm uppercase tracking-wide">
                                        {displaySubtitle}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {isClinica && (
                                <button
                                    onClick={() => setShowCatalogue(true)}
                                    className="flex items-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                                >
                                    <BookOpen className="h-5 w-5 text-slate-400" />
                                    Ver Catálogo
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/trabalhos/novo', { state: { preSelectedLabId: labId, preSelectedLabColor: primaryColor } })}
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
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-slate-200 transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">{labelFinanceiro}</p>
                                <h3 className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalValor)}</h3>
                            </div>
                            <div style={{ color: primaryColor }}><IconFinanceiro className="h-8 w-8" /></div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: primaryColor }}></div>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400">{labelNovos}</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900">{pendentes}</h3>
                        </div>
                        <AlertCircle className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div><p className="text-xs font-bold uppercase text-slate-400">Em Produção</p><h3 className="mt-2 text-2xl font-black text-slate-900">{emProducao}</h3></div>
                        <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div><p className="text-xs font-bold uppercase text-slate-400">Concluídos</p><h3 className="mt-2 text-2xl font-black text-slate-900">{concluidos}</h3></div>
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                </div>

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
                        <div className="lg:col-span-2 relative">
                            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition" placeholder="Buscar..." onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                        </div>
                        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none">
                            <option value="Todos">Status: Todos</option>
                            <option value="Pendente">Pendente</option>
                            <option value="EmProducao">Em Produção</option>
                            <option value="Concluido">Concluído</option>
                        </select>
                        {!isClinica ? (
                            <select value={clinicaSelecionadaId} onChange={e => setClinicaSelecionadaId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none">
                                <option value="Todos">Clínicas: Todas</option>
                                {clinicasParaFiltro.map((p: any) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                            </select>
                        ) : (<div className="hidden lg:block"></div>)}
                        <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 tracking-wider">
                        <tr><th className="px-6 py-4">Paciente</th><th className="px-6 py-4">Serviço</th><th className="px-6 py-4">Data</th><th className="px-6 py-4">Valor</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {trabalhosFiltrados.map((trabalho) => {
                            const statusInfo = getStatusInfo(trabalho.status);
                            return (
                                <tr key={trabalho.id} className="hover:bg-slate-50 transition cursor-pointer group" onClick={() => navigate(`/trabalhos/${trabalho.id}`)}>
                                    <td className="px-6 py-4"><span className="font-bold text-slate-900 block">{trabalho.pacienteNome}</span><span className="text-xs text-slate-400 font-mono">#{trabalho.id.substring(0, 8)}</span></td>
                                    <td className="px-6 py-4">{trabalho.servico?.nome || 'Personalizado'}</td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-slate-400"/> {formatDate(trabalho.dataEntregaPrevista)}</div></td>
                                    <td className="px-6 py-4 font-bold">{formatCurrency(trabalho.valorFinal)}</td>
                                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusInfo.color}`}><statusInfo.icon className="h-3 w-3" /> {statusInfo.label}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {!isClinica && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setTrabalhoParaExcluir(trabalho.id); }}
                                                    className="rounded-lg p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                                                    title="Apagar Trabalho"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition" />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    {trabalhosFiltrados.length === 0 && <div className="p-10 text-center text-slate-400">Nenhum pedido encontrado.</div>}
                </div>
            </div>
        </PageContainer>
    );
}