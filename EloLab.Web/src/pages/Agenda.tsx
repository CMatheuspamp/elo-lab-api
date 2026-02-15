import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import { useNavigate } from 'react-router-dom';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Loader2, Clock, CheckCircle2, PlayCircle, AlertCircle
} from 'lucide-react';

export function Agenda() {
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [trabalhos, setTrabalhos] = useState<any[]>([]);

    // Controlo do Mês/Ano atual na view
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        loadTrabalhos();
    }, []);

    async function loadTrabalhos() {
        try {
            const res = await api.get('/Trabalhos');
            setTrabalhos(res.data);
        } catch (e) {
            notify.error("Erro ao carregar os trabalhos para a agenda.");
        } finally {
            setLoading(false);
        }
    }

    // === LÓGICA DO CALENDÁRIO ===
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Ajuste para a semana começar à Segunda-feira
    let firstDayOfMonth = new Date(year, month, 1).getDay();
    let startingEmptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

    function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
    function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }
    function goToToday() { setCurrentDate(new Date()); }

    // === LÓGICA INTELIGENTE DE ATRASO (A mesma do Dashboard!) ===
    const isAtrasado = (trab: any) => {
        const s = (trab.status || trab.Status || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (s.includes('concluido') || s.includes('finalizado') || s.includes('expedido')) return false;

        const dataOriginal = trab.dataEntregaPrevista || trab.DataEntregaPrevista;
        if (!dataOriginal) return false;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const entrega = new Date(dataOriginal);
        entrega.setHours(0, 0, 0, 0);

        return entrega < hoje;
    };

    // Computa o status efetivo para pintar a etiqueta
    const getEffectiveStatus = (trab: any) => {
        if (isAtrasado(trab)) return 'atrasado';
        const original = trab.status || trab.Status || 'pendente';
        return original.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    };

    // Define as cores baseadas no Status Efetivo
    function getStatusConfig(effectiveStatus: string) {
        switch (effectiveStatus) {
            case 'concluido':
            case 'finalizado':
            case 'expedido':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', icon: CheckCircle2 };
            case 'em producao':
            case 'emproducao':
                return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: PlayCircle };
            case 'atrasado':
                return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: AlertCircle };
            default: // Pendente / Recebido
                return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: Clock };
        }
    }

    const calendarCells = [];

    // Células vazias (dias do mês anterior)
    for (let i = 0; i < startingEmptyCells; i++) {
        calendarCells.push(<div key={`empty-${i}`} className="bg-slate-50/50 border-r border-b border-slate-100 p-2 min-h-[160px]"></div>);
    }

    // Dias do mês atual
    const hoje = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = hoje.getDate() === d && hoje.getMonth() === month && hoje.getFullYear() === year;
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        const trabalhosDoDia = trabalhos.filter(t => {
            const dataOriginal = t.dataEntregaPrevista || t.DataEntregaPrevista;
            if (!dataOriginal) return false;
            const dataCortada = typeof dataOriginal === 'string' ? dataOriginal.split('T')[0] : '';
            return dataCortada === dateString;
        });

        calendarCells.push(
            <div key={`day-${d}`} className={`bg-white border-r border-b border-slate-200 p-2 min-h-[160px] transition-colors hover:bg-slate-50 relative flex flex-col ${isToday ? 'bg-blue-50/20' : ''}`}>
                <div className="flex justify-between items-start mb-2 shrink-0">
                    <span className={`text-sm font-bold flex items-center justify-center h-7 w-7 rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>
                        {d}
                    </span>
                    {trabalhosDoDia.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                            {trabalhosDoDia.length} ped.
                        </span>
                    )}
                </div>

                {/* === LISTA DE TRABALHOS === */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[110px] custom-scrollbar pr-1 group/list">
                    {trabalhosDoDia.map(trab => {
                        const idReal = trab.id || trab.Id || '';
                        const pacienteReal = trab.pacienteNome || trab.PacienteNome || `Ped. #${String(idReal).substring(0,4)}`;
                        const clinicaNome = trab.clinica?.nome || trab.Clinica?.Nome || 'Clínica não def.';

                        // 1. Descobrir se está atrasado ou não
                        const effectiveStatus = getEffectiveStatus(trab);
                        // 2. Buscar as cores corretas
                        const statusConfig = getStatusConfig(effectiveStatus);
                        const StatusIcon = statusConfig.icon;

                        // Para o título (Tooltip), mostramos o status real, mas se estiver atrasado dizemos "Em Atraso!"
                        const originalStatus = trab.status || trab.Status || 'Pendente';
                        const displayStatus = effectiveStatus === 'atrasado' ? `Atrasado (Era ${originalStatus})` : originalStatus;

                        return (
                            <div
                                key={idReal}
                                onClick={() => navigate(`/trabalhos/${idReal}`)}
                                className={`p-1.5 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col justify-center relative 
                                    ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
                                    hover:shadow-md hover:z-10 hover:scale-[1.03] 
                                    group-hover/list:opacity-40 hover:!opacity-100
                                `}
                                title={`${pacienteReal} - ${clinicaNome} (${displayStatus})`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-bold truncate leading-tight">{pacienteReal}</span>
                                </div>
                                <span className="text-[10px] truncate pl-5 opacity-80 leading-none mt-0.5 font-medium">
                                    {clinicaNome}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

    return (
        <PageContainer primaryColor={primaryColor}>
            {/* === CABEÇALHO === */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl border border-blue-200">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        Agenda de Entregas
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Controle os prazos e organize a produção do seu laboratório.</p>
                </div>

                {/* Controlos do Calendário */}
                <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"><ChevronLeft className="h-5 w-5" /></button>
                    <div className="w-40 text-center font-black text-slate-800 text-lg">
                        {monthNames[month]} {year}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"><ChevronRight className="h-5 w-5" /></button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={goToToday} className="px-4 py-2 font-bold text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                        Hoje
                    </button>
                </div>
            </div>

            {/* === GRELHA DO CALENDÁRIO === */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                {/* Dias da Semana (Header) */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
                    {dayNames.map(day => (
                        <div key={day} className="py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Dias do Mês */}
                <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-slate-200">
                    {calendarCells}
                </div>
            </div>

            {/* === LEGENDA === */}
            <div className="mt-6 flex flex-wrap gap-4 px-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm ring-2 ring-amber-100"></div> Pendente / Recebido
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm ring-2 ring-blue-100"></div> Em Produção
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-100"></div> Concluído / Expedido
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-2 ring-red-100"></div> Atrasado
                </div>
            </div>

        </PageContainer>
    );
}