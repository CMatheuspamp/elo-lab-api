import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { notify } from '../utils/notify';
import {
    TrendingUp, AlertCircle, Clock, CheckCircle,
    Filter, Search, Plus, Calendar, ArrowRight, Trash2, ArrowLeft, BookOpen, X, Info, Building2, Pencil
} from 'lucide-react';
import type { UserSession, Trabalho } from '../types';
import { PageContainer } from '../components/PageContainer';

export function Dashboard() {
    const navigate = useNavigate();
    const { labId } = useParams();

    const [user, setUser] = useState<UserSession | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [labInfo, setLabInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showCatalogue, setShowCatalogue] = useState(false);
    const [catalogoServicos, setCatalogoServicos] = useState<any[]>([]);
    const [servicoDetalhe, setServicoDetalhe] = useState<any | null>(null);

    const [clinicaSelecionadaId, setClinicaSelecionadaId] = useState('Todos');
    const [clinicasParaFiltro, setClinicasParaFiltro] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroMes, setFiltroMes] = useState('');

    const [trabalhoParaExcluir, setTrabalhoParaExcluir] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanPath}`;
    };

    // === LÓGICA INTELIGENTE DE ATRASO ===
    const isAtrasado = (t: Trabalho) => {
        const s = (t.status || '').toLowerCase();
        if (s.includes('concluido') || s.includes('finalizado') || s.includes('entregue')) return false;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const entrega = new Date(t.dataEntregaPrevista);
        entrega.setHours(0, 0, 0, 0);

        return entrega < hoje;
    };

    const getEffectiveStatus = (t: Trabalho) => {
        if (isAtrasado(t)) return 'Atrasado';
        return t.status;
    };

    const getStatusInfo = (t: Trabalho) => {
        if (isAtrasado(t)) return { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Em Atraso' };

        const s = (t.status || '').toString().toLowerCase();
        if (s.includes('pendente') || s.includes('recebido')) return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, label: 'Pendente' };
        if (s.includes('producao') || s.includes('emproducao')) return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp, label: 'Em Produção' };
        if (s.includes('concluido') || s.includes('finalizado')) return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Concluído' };
        return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock, label: t.status };
    };

    const loadData = useCallback(async () => {
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

                const servicosRes = await api.get(`/Servicos/por-clinica/${userData.meusDados.id}?laboratorioId=${labId}`);
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
    }, [navigate, labId]);

    useEffect(() => {
        loadData();

        const handleRealtimeUpdate = (e: any) => {
            const notificacao = e.detail;
            const t = notificacao.titulo.toLowerCase();
            if (t.includes('pedido') || t.includes('status') || t.includes('trabalho') || t.includes('vínculo')) {
                loadData();
            }
        };

        window.addEventListener('elolab_nova_notificacao', handleRealtimeUpdate);
        return () => window.removeEventListener('elolab_nova_notificacao', handleRealtimeUpdate);
    }, [loadData]);

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

    // --- NOVA FUNÇÃO DE NAVEGAR PARA A PÁGINA DE EDIÇÃO ---
    function irParaEdicao(trabalho: Trabalho) {
        navigate('/trabalhos/novo', {
            state: {
                editMode: true,
                trabalho,
                preSelectedLabColor: primaryColor
            }
        });
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
    const labelNovos = isClinica ? 'Pendentes' : 'Novos Pedidos';

    const trabalhosFiltrados = trabalhos.filter(t => {
        const clinicaNome = t.clinica?.nome || '';
        const textoMatch = t.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
            t.id.toLowerCase().includes(busca.toLowerCase()) ||
            (t.servico?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
            clinicaNome.toLowerCase().includes(busca.toLowerCase());

        const effective = getEffectiveStatus(t);
        const statusMatch = filtroStatus === 'Todos' || effective === filtroStatus;
        const clinicaMatch = clinicaSelecionadaId === 'Todos' || t.clinicaId === clinicaSelecionadaId;
        let dataMatch = true;
        if (filtroMes) {
            const dataRef = t.dataEntregaPrevista || t.createdAt;
            dataMatch = new Date(dataRef).toISOString().slice(0, 7) === filtroMes;
        }
        return textoMatch && statusMatch && clinicaMatch && dataMatch;
    });

    const pendentes = trabalhosFiltrados.filter(t => getEffectiveStatus(t) === 'Pendente').length;
    const emProducao = trabalhosFiltrados.filter(t => getEffectiveStatus(t) === 'EmProducao').length;
    const concluidos = trabalhosFiltrados.filter(t => getEffectiveStatus(t) === 'Concluido').length;
    const atrasados = trabalhosFiltrados.filter(t => getEffectiveStatus(t) === 'Atrasado').length;

    return (
        <PageContainer primaryColor={primaryColor}>
            {/* === MODAL EXCLUSÃO === */}
            {trabalhoParaExcluir && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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

            {/* === MODAL CATÁLOGO === */}
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
                                    <div key={s.id} onClick={() => setServicoDetalhe(s)} className="group cursor-pointer bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                                        <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                                            {s.fotoUrl ? (
                                                <img src={getFullUrl(s.fotoUrl)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" alt={s.nome} />
                                            ) : (
                                                <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                                                    <Info className="h-10 w-10 mb-2 opacity-50" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Sem Imagem</span>
                                                </div>
                                            )}
                                            {s.material && (
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                                                    {s.material}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600 transition">{s.nome}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                                <Clock className="h-3 w-3" /> {s.prazoDiasUteis} dias úteis
                                            </div>
                                            <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                                                <span className={`text-xl font-black ${s.isTabela ? 'text-emerald-600' : 'text-slate-900'}`}>{formatCurrency(s.precoBase)}</span>
                                                {s.isTabela ? (
                                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded-lg">Preço VIP</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition">Ver Detalhes</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {servicoDetalhe && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in zoom-in duration-200">
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
                                            <span className={`text-2xl font-black ${servicoDetalhe.isTabela ? 'text-emerald-600' : 'text-slate-900'}`}>{formatCurrency(servicoDetalhe.precoBase)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setServicoDetalhe(null);
                                            setShowCatalogue(false);
                                            navigate('/trabalhos/novo', { state: { preSelectedLabId: labId, preSelectedLabColor: primaryColor, preSelectedServiceId: servicoDetalhe.id } });
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
                {/* HEADER DASHBOARD */}
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

                {/* === CARDS DE RESUMO === */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-amber-200 transition">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400">{labelNovos}</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900">{pendentes}</h3>
                        </div>
                        <Clock className="h-8 w-8 text-amber-400" />
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400">Em Produção</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900">{emProducao}</h3>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition">
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400">Concluídos</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900">{concluidos}</h3>
                        </div>
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-red-100 group hover:border-red-300 transition hover:shadow-md">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-xs font-bold uppercase text-red-500">Em Atraso</p>
                                <h3 className="mt-2 text-2xl font-black text-red-600">{atrasados}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-red-500 group-hover:h-1.5 transition-all"></div>
                    </div>
                </div>

                {/* === FILTROS E LISTA === */}
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
                            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition" placeholder="Buscar por paciente, serviço ou clínica..." onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                        </div>
                        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-medium text-slate-700">
                            <option value="Todos">Status: Todos</option>
                            <option value="Pendente">Pendente</option>
                            <option value="EmProducao">Em Produção</option>
                            <option value="Concluido">Concluído</option>
                            <option value="Atrasado">Em Atraso</option>
                        </select>
                        {!isClinica ? (
                            <select value={clinicaSelecionadaId} onChange={e => setClinicaSelecionadaId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-medium text-slate-700">
                                <option value="Todos">Clínicas: Todas</option>
                                {clinicasParaFiltro.map((p: any) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                            </select>
                        ) : (<div className="hidden lg:block"></div>)}
                        <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-slate-700" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Paciente</th>
                            <th className="px-6 py-4">Serviço</th>
                            <th className="px-6 py-4">Entrada</th>
                            <th className="px-6 py-4">Entrega</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {trabalhosFiltrados.map((trabalho) => {
                            const statusInfo = getStatusInfo(trabalho);
                            return (
                                <tr key={trabalho.id} className="hover:bg-slate-50 transition cursor-pointer group" onClick={() => navigate(`/trabalhos/${trabalho.id}`)}>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-900 block text-base leading-tight">{trabalho.pacienteNome}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {!isClinica && (
                                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                                    <Building2 className="h-3 w-3" />
                                                    {trabalho.clinica?.nome || 'Clínica não def.'}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400 font-mono">#{trabalho.id.substring(0, 8)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 font-medium">{trabalho.servico?.nome || 'Personalizado'}</td>

                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-500 font-medium">
                                            {formatDate(trabalho.createdAt)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 font-bold ${isAtrasado(trabalho) ? 'text-red-600' : 'text-slate-600'}`}>
                                            <Calendar className={`h-4 w-4 ${isAtrasado(trabalho) ? 'text-red-500' : 'text-slate-400'}`}/>
                                            {formatDate(trabalho.dataEntregaPrevista)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusInfo.color}`}>
                                            <statusInfo.icon className="h-3.5 w-3.5" /> {statusInfo.label}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!isClinica && (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); irParaEdicao(trabalho); }} className="rounded-lg p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition" title="Editar Trabalho">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setTrabalhoParaExcluir(trabalho.id); }} className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition" title="Excluir Trabalho">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                            <div className="rounded-lg p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    {trabalhosFiltrados.length === 0 && (
                        <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                            <Search className="h-10 w-10 mb-4 opacity-20" />
                            <p className="font-bold text-lg text-slate-600">Nenhum pedido encontrado.</p>
                            <p className="text-sm">Altere os filtros de pesquisa para ver mais resultados.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}