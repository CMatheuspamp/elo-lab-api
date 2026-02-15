import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    Euro, TrendingUp, AlertCircle, CheckCircle2,
    Filter, Search, Calendar, Building2, Receipt,
    DownloadCloud, Loader2, Wallet, Clock
} from 'lucide-react';

export function Financeiro() {
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [trabalhos, setTrabalhos] = useState<any[]>([]);
    const [clinicas, setClinicas] = useState<any[]>([]);

    // Filtros
    const [busca, setBusca] = useState('');
    const [clinicaSelecionada, setClinicaSelecionada] = useState('Todas');
    const [statusPagamento, setStatusPagamento] = useState('Todos');

    // Filtros de Data (Início e Fim do mês atual por defeito)
    const dataAtual = new Date();
    const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0).toISOString().split('T')[0];

    const [dataInicio, setDataInicio] = useState(primeiroDia);
    const [dataFim, setDataFim] = useState(ultimoDia);

    useEffect(() => {
        loadFinanceiro();
    }, []);

    async function loadFinanceiro() {
        try {
            const [resTrab, resClin] = await Promise.all([
                api.get('/Trabalhos'),
                api.get('/Clinicas')
            ]);

            // Só nos interessam trabalhos que tenham valor final
            setTrabalhos(resTrab.data.filter((t: any) => t.valorFinal > 0));
            setClinicas(resClin.data);
        } catch (e) {
            notify.error("Erro ao carregar dados financeiros.");
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // === LÓGICA FINANCEIRA REFINADA ===
    const isPago = (t: any) => t.pago === true;

    const getStatusFinanceiro = (t: any) => {
        // 1. Se já pagou, está verde (Recebido)
        if (isPago(t)) return { id: 'pago', label: 'Recebido', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 };

        // 2. Verifica se o trabalho está concluído
        const statusStr = t.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
        const isConcluido = statusStr.includes('concluido') || statusStr.includes('finalizado') || statusStr.includes('entregue');

        // 3. Verifica se o dia de hoje é maior ou igual à data de entrega prevista
        let dataEntregaChegou = false;
        if (t.dataEntregaPrevista) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar só os dias
            const entrega = new Date(t.dataEntregaPrevista);
            entrega.setHours(0, 0, 0, 0);

            dataEntregaChegou = hoje >= entrega;
        }

        // 4. Regra de negócio: Só é "Dívida" se já estiver concluído E a data combinada já tiver chegado!
        if (isConcluido && dataEntregaChegou) {
            return { id: 'divida', label: 'Em Dívida', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
        }

        // 5. Caso contrário (ainda em produção, ou concluído mas entregue adiantado), fica como "A Receber"
        return { id: 'pendente', label: 'A Receber', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
    };

    // === CHAMADA REAL À API ===
    async function alternarPagamento(id: string, estadoAtual: boolean) {
        setActionLoading(id);
        const novoEstado = !estadoAtual;

        try {
            await api.patch(`/Trabalhos/${id}/pagamento`, { pago: novoEstado });

            setTrabalhos(prev => prev.map(t => t.id === id ? { ...t, pago: novoEstado } : t));

            if (novoEstado) notify.success("Pagamento registado com sucesso!");
            else notify.success("Pagamento revertido para pendente.");
        } catch (e) {
            // interceptor cuida
        } finally {
            setActionLoading(null);
        }
    }

    // === FILTRAGEM ===
    const trabalhosFiltrados = trabalhos.filter(t => {
        const textoMatch = t.pacienteNome?.toLowerCase().includes(busca.toLowerCase()) ||
            t.clinica?.nome?.toLowerCase().includes(busca.toLowerCase());

        const clinicaMatch = clinicaSelecionada === 'Todas' || t.clinicaId === clinicaSelecionada;

        const pago = isPago(t);
        const statusMatch = statusPagamento === 'Todos' ||
            (statusPagamento === 'Pagos' && pago) ||
            (statusPagamento === 'Pendentes' && !pago);

        const dataRef = t.dataEntregaPrevista ? new Date(t.dataEntregaPrevista).toISOString().split('T')[0] : '';
        const dataMatch = (!dataInicio || dataRef >= dataInicio) && (!dataFim || dataRef <= dataFim);

        return textoMatch && clinicaMatch && statusMatch && dataMatch;
    });

    // === CÁLCULOS DOS CARDS ===
    const totalFaturado = trabalhosFiltrados.reduce((acc, t) => acc + (t.valorFinal || 0), 0);
    const totalRecebido = trabalhosFiltrados.filter(isPago).reduce((acc, t) => acc + (t.valorFinal || 0), 0);
    const totalAReceber = totalFaturado - totalRecebido;

    function limparFiltros() {
        setBusca('');
        setClinicaSelecionada('Todas');
        setStatusPagamento('Todos');
        setDataInicio(primeiroDia);
        setDataFim(ultimoDia);
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

    return (
        <PageContainer primaryColor={primaryColor}>
            {/* === CABEÇALHO === */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl border border-blue-200" style={{ color: primaryColor, backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}>
                            <Wallet className="h-6 w-6" />
                        </div>
                        Gestão Financeira
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Controle o seu faturamento, cobranças e pagamentos reais.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition">
                    <DownloadCloud className="h-4 w-4" /> Exportar Relatório
                </button>
            </div>

            {/* === OS 3 CARDS FINANCEIROS === */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
                {/* Card 1: Total Faturado */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden group hover:border-blue-300 transition">
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Faturamento Total</p>
                        <h3 className="mt-2 text-3xl font-black text-slate-900">{formatCurrency(totalFaturado)}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">No período selecionado</p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center relative z-10 border border-blue-100">
                        <TrendingUp className="h-7 w-7 text-blue-600" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition"></div>
                </div>

                {/* Card 2: A Receber */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden group hover:border-amber-300 transition">
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">A Receber</p>
                        <h3 className="mt-2 text-3xl font-black text-amber-600">{formatCurrency(totalAReceber)}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">{trabalhosFiltrados.filter(t => !isPago(t)).length} trabalhos pendentes</p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center relative z-10 border border-amber-100">
                        <Clock className="h-7 w-7 text-amber-500" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition"></div>
                </div>

                {/* Card 3: Recebidos */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden group hover:border-emerald-300 transition">
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Recebido</p>
                        <h3 className="mt-2 text-3xl font-black text-emerald-600">{formatCurrency(totalRecebido)}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">Dinheiro em caixa</p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center relative z-10 border border-emerald-100">
                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition"></div>
                </div>
            </div>

            {/* === ZONA DE FILTROS === */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Filter className="h-4 w-4" /> Filtrar Faturamento
                    </h3>
                    <button onClick={limparFiltros} className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>
                        Limpar Filtros
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                        <input type="text" value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition text-sm font-medium" placeholder="Buscar paciente ou clínica..." onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <select value={clinicaSelecionada} onChange={e => setClinicaSelecionada(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-bold text-slate-700">
                        <option value="Todas">Clínicas: Todas</option>
                        {clinicas.map((c: any) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                    </select>
                    <select value={statusPagamento} onChange={e => setStatusPagamento(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-bold text-slate-700">
                        <option value="Todos">Status: Todos</option>
                        <option value="Pendentes">A Receber</option>
                        <option value="Pagos">Recebidos</option>
                    </select>
                    <div className="relative">
                        <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase">Data Início</span>
                        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-bold text-slate-700" />
                    </div>
                    <div className="relative">
                        <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase">Data Fim</span>
                        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-bold text-slate-700" />
                    </div>
                </div>
            </div>

            {/* === TABELA DE FATURAMENTO === */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400 tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Trabalho / Paciente</th>
                        <th className="px-6 py-4">Clínica</th>
                        <th className="px-6 py-4">Entrega</th>
                        <th className="px-6 py-4 text-right">Valor Final</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Ações Financeiras</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {trabalhosFiltrados.map((t) => {
                        const status = getStatusFinanceiro(t);
                        const StatusIcon = status.icon;
                        const pago = isPago(t);

                        return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition group">
                                <td className="px-6 py-4">
                                    <span className="font-bold text-slate-900 block text-base">{t.pacienteNome || 'Sem Nome'}</span>
                                    <span className="text-xs text-slate-400 font-mono">#{t.id.substring(0, 8)} • {t.servico?.nome || 'Personalizado'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5 bg-slate-100 w-fit px-2.5 py-1 rounded-lg border border-slate-200/60">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                        {t.clinica?.nome || 'Não definida'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 font-medium text-slate-500">
                                        <Calendar className="h-3.5 w-3.5 opacity-70"/>
                                        {formatDate(t.dataEntregaPrevista)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-lg font-black text-slate-900">
                                        {formatCurrency(t.valorFinal || 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.color}`}>
                                        <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="rounded-xl p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition shadow-sm" title="Gerar Recibo / Fatura">
                                            <Receipt className="h-4 w-4" />
                                        </button>

                                        {!pago ? (
                                            <button
                                                onClick={() => alternarPagamento(t.id, pago)}
                                                disabled={actionLoading === t.id}
                                                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-md shadow-emerald-200 transition disabled:opacity-50"
                                            >
                                                {actionLoading === t.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Euro className="h-4 w-4" />} Registar Pagamento
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => alternarPagamento(t.id, pago)}
                                                disabled={actionLoading === t.id}
                                                className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
                                            >
                                                {actionLoading === t.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Desfazer'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                {trabalhosFiltrados.length === 0 && (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                        <Wallet className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-bold text-lg text-slate-600">Nenhum faturamento encontrado.</p>
                        <p className="text-sm mt-1">Altere o período ou os filtros para ver mais resultados.</p>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}