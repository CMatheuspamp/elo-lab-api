import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    Bell, Check, MessageSquare, Package, Clock, ArrowRight, Trash2
} from 'lucide-react';

export function Notifications() {
    const navigate = useNavigate();
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    const [notificacoes, setNotificacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para controlar o Modal de Confirmação
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'delete-one' | 'delete-all' | 'mark-all-read' | null;
        targetId?: string;
        title: string;
        message: string;
        confirmLabel: string;
        isDestructive: boolean;
    }>({
        isOpen: false,
        type: null,
        title: '',
        message: '',
        confirmLabel: '',
        isDestructive: false
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const res = await api.get('/Notificacoes');
            setNotificacoes(res.data);
        } catch (error) {
            console.error("Erro ao carregar notificações");
        } finally {
            setLoading(false);
        }
    }

    // Ação ao clicar no card (Navegar/Ler)
    async function handleCardClick(notif: any) {
        if (!notif.lida) {
            try {
                await api.patch(`/Notificacoes/${notif.id}/lida`);
                setNotificacoes(prev => prev.map(n => n.id === notif.id ? { ...n, lida: true } : n));
            } catch (e) { console.error(e); }
        }
        if (notif.linkAction) {
            navigate(notif.linkAction);
        }
    }

    // Funções para ABRIR o modal
    function openDeleteOne(id: string, e: React.MouseEvent) {
        e.stopPropagation(); // Impede o clique no card
        setModalConfig({
            isOpen: true,
            type: 'delete-one',
            targetId: id,
            title: 'Excluir notificação?',
            message: 'Esta notificação será removida permanentemente.',
            confirmLabel: 'Sim, Excluir',
            isDestructive: true
        });
    }

    function openDeleteAll() {
        setModalConfig({
            isOpen: true,
            type: 'delete-all',
            title: 'Limpar tudo?',
            message: 'Tem a certeza que deseja apagar todas as notificações do seu histórico?',
            confirmLabel: 'Sim, Limpar Tudo',
            isDestructive: true
        });
    }

    function openMarkAllRead() {
        setModalConfig({
            isOpen: true,
            type: 'mark-all-read',
            title: 'Marcar todas como lidas?',
            message: 'Todas as notificações pendentes serão marcadas como vistas.',
            confirmLabel: 'Sim, Marcar',
            isDestructive: false
        });
    }

    // Executar ação confirmada
    async function handleConfirmAction() {
        try {
            if (modalConfig.type === 'delete-one' && modalConfig.targetId) {
                await api.delete(`/Notificacoes/${modalConfig.targetId}`);
                setNotificacoes(prev => prev.filter(n => n.id !== modalConfig.targetId));
                notify.success("Notificação removida.");
            }
            else if (modalConfig.type === 'delete-all') {
                await api.delete('/Notificacoes/todas');
                setNotificacoes([]);
                notify.success("Todas as notificações foram apagadas.");
            }
            else if (modalConfig.type === 'mark-all-read') {
                await api.patch('/Notificacoes/marcar-todas-lidas');
                setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
                notify.success("Tudo marcado como lido.");
            }
        } catch (error) {
            notify.error("Ocorreu um erro ao processar a ação.");
        } finally {
            setModalConfig({ ...modalConfig, isOpen: false });
        }
    }

    const getIcon = (titulo: string) => {
        const t = titulo.toLowerCase();
        if (t.includes('mensagem')) return <MessageSquare className="h-5 w-5 text-blue-500" />;
        if (t.includes('status')) return <Clock className="h-5 w-5 text-orange-500" />;
        if (t.includes('novo')) return <Package className="h-5 w-5 text-emerald-500" />;
        return <Bell className="h-5 w-5 text-slate-400" />;
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">A carregar...</div>;

    const naoLidas = notificacoes.filter(n => !n.lida).length;

    return (
        <PageContainer primaryColor={primaryColor}>

            {/* === MODAL === */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 ${modalConfig.isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {modalConfig.isDestructive ? <Trash2 className="h-6 w-6" /> : <Check className="h-6 w-6" />}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{modalConfig.title}</h3>
                        <p className="text-sm text-slate-500 mb-6">{modalConfig.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`flex-1 rounded-xl py-3 font-bold text-white shadow-lg transition ${modalConfig.isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'hover:opacity-90 shadow-blue-200'}`}
                                style={!modalConfig.isDestructive ? { backgroundColor: primaryColor } : {}}
                            >
                                {modalConfig.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            Notificações
                            {naoLidas > 0 && (
                                <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold border border-red-200">
                                    {naoLidas} novas
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 mt-1">Acompanhe as atualizações dos seus trabalhos e mensagens.</p>
                    </div>

                    <div className="flex gap-2">
                        {naoLidas > 0 && (
                            <button
                                onClick={openMarkAllRead}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition"
                            >
                                <Check className="h-4 w-4" /> <span className="hidden sm:inline">Marcar lidas</span>
                            </button>
                        )}
                        {notificacoes.length > 0 && (
                            <button
                                onClick={openDeleteAll}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 shadow-sm text-red-500 hover:bg-red-50 hover:border-red-100 transition"
                            >
                                <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Limpar tudo</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {notificacoes.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Tudo limpo!</h3>
                            <p className="text-slate-400">Não tem notificações recentes.</p>
                        </div>
                    ) : (
                        notificacoes.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleCardClick(n)}
                                className={`group relative overflow-hidden rounded-2xl border p-4 transition-all cursor-pointer hover:shadow-md
                                    ${!n.lida
                                    ? 'bg-white border-blue-200 shadow-sm'
                                    : 'bg-slate-50 border-slate-200 opacity-85 hover:opacity-100'}`}
                            >
                                {/* Indicador de não lida (Barra Lateral) */}
                                {!n.lida && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: primaryColor }}></div>
                                )}

                                {/* FLEX CONTAINER PRINCIPAL - AGORA ALINHA TUDO AO CENTRO */}
                                <div className="flex items-center gap-4">

                                    {/* 1. COLUNA ESQUERDA: ÍCONE */}
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${!n.lida ? 'bg-blue-50' : 'bg-white border border-slate-200'}`}>
                                        {getIcon(n.titulo)}
                                    </div>

                                    {/* 2. COLUNA CENTRAL: TEXTO (Expande) */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                                            <h3 className={`text-base truncate pr-2 ${!n.lida ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                {n.titulo}
                                            </h3>
                                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                                {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                                            {n.texto}
                                        </p>
                                    </div>

                                    {/* 3. COLUNA DIREITA: AÇÕES (Botões) */}
                                    {/* Separado do texto, alinhado verticalmente ao centro */}
                                    <div className="flex items-center gap-2 pl-3 border-l border-transparent group-hover:border-slate-100">
                                        <button
                                            onClick={(e) => openDeleteOne(n.id, e)}
                                            className="p-2.5 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                                            title="Excluir notificação"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>

                                        <div className="hidden sm:block text-slate-300 group-hover:text-primary transition group-hover:translate-x-1"
                                             style={{ color: !n.lida ? primaryColor : undefined }}>
                                            <ArrowRight className="h-5 w-5" />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageContainer>
    );
}