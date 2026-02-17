import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, Building2,
    Tag, UserCircle, LogOut, Users, Bell, ScrollText, CalendarDays, Wallet,
    ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const userType = localStorage.getItem('elolab_user_type');
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';
    const logoUrl = localStorage.getItem('elolab_user_logo');

    // === A CHAVE DO MESTRE ===
    const isSuperAdmin = localStorage.getItem('elolab_is_admin') === 'true';

    const [unreadCount, setUnreadCount] = useState(0);

    async function fetchInitialCount() {
        try {
            const res = await api.get('/Notificacoes');
            const count = res.data.filter((n: any) => !n.lida && !n.Lida).length;
            setUnreadCount(count);
        } catch (e) {
            console.error("Erro ao carregar contador", e);
        }
    }

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        fetchInitialCount();

        const handleNewNotification = () => setUnreadCount(prev => prev + 1);
        const handleSyncRequest = () => fetchInitialCount();

        window.addEventListener('elolab_nova_notificacao', handleNewNotification);
        window.addEventListener('elolab_notificacoes_atualizar', handleSyncRequest);

        return () => {
            window.removeEventListener('elolab_nova_notificacao', handleNewNotification);
            window.removeEventListener('elolab_notificacoes_atualizar', handleSyncRequest);
        };
    }, []);

    const getBadgeText = () => {
        if (unreadCount <= 0) return null;
        return unreadCount > 9 ? '9+' : unreadCount;
    };

    const sidebarStyle = {
        background: `linear-gradient(180deg, ${primaryColor}15 0%, #ffffff 45%)`,
        borderRight: `1px solid ${primaryColor}20`
    };

    const isActive = (path: string) => location.pathname === path;

    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanPath}`;
    };

    // ==========================================================
    // 1. MENU EXCLUSIVO PARA O SUPER ADMIN (Visão Global)
    // ==========================================================
    const adminMenu = [
        { label: 'Painel Mestre', icon: ShieldAlert, path: '/admin', show: true },
        // No futuro podemos adicionar: { label: 'Faturação Global', icon: Wallet, path: '/admin/financeiro', show: true },
        { label: 'Notificações', icon: Bell, path: '/notificacoes', show: true, hasBadge: true },
        { label: 'Meu Perfil', icon: UserCircle, path: '/perfil', show: true },
    ];

    // ==========================================================
    // 2. MENU PADRÃO (Laboratórios e Clínicas comuns)
    // ==========================================================
    const normalMenu = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', show: userType === 'Laboratorio' },
        { label: 'Minhas Clínicas', icon: Users, path: '/clinicas', show: userType === 'Laboratorio' },
        { label: 'Meus Laboratórios', icon: Building2, path: '/parceiros', show: userType === 'Clinica' },
        { label: 'Novo Pedido', icon: PlusCircle, path: '/trabalhos/novo', show: true },
        { label: 'Serviços & Preços', icon: Tag, path: '/servicos', show: userType === 'Laboratorio' },
        { label: 'Tabelas de Preços', icon: ScrollText, path: '/tabelas', show: userType === 'Laboratorio' },
        { label: 'Financeiro', icon: Wallet, path: '/financeiro', show: userType === 'Laboratorio' },
        { label: 'Agenda', icon: CalendarDays, path: '/agenda', show: userType === 'Laboratorio' },
        { label: 'Notificações', icon: Bell, path: '/notificacoes', show: true, hasBadge: true },
        { label: 'Meu Perfil', icon: UserCircle, path: '/perfil', show: true },
    ];

    // O Sistema decide que menu mostrar consoante o poder do utilizador
    const menuItems = isSuperAdmin ? adminMenu : normalMenu;

    function handleLogout() {
        localStorage.clear();
        navigate('/');
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-20 transition-all duration-300" style={sidebarStyle}>
            <div className="flex h-48 flex-col items-center justify-center border-b border-slate-100/50 px-6 py-6">
                {logoUrl ? (
                    <img src={getFullUrl(logoUrl)} alt="Logo" className="max-h-40 w-auto max-w-full object-contain drop-shadow-sm transition-transform hover:scale-105" />
                ) : (
                    <div className="flex flex-col items-center gap-3 w-full h-full justify-center">
                        <img src="/logo.png" alt="EloLab Systems" className="max-h-32 w-auto max-w-full object-contain drop-shadow-sm transition-transform hover:scale-105" />
                    </div>
                )}
            </div>

            <nav className="flex-1 space-y-1.5 p-4 py-6 overflow-y-auto custom-scrollbar">
                {menuItems.filter(i => i.show).map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200
                                ${!active && 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-900'}`}
                            style={active ? {
                                backgroundColor: `${primaryColor}15`,
                                color: primaryColor,
                                fontWeight: '700',
                                borderRight: `3px solid ${primaryColor}`
                            } : {}}
                        >
                            <item.icon className={`h-5 w-5 transition-colors`} style={active ? { color: primaryColor } : {}} />
                            <span className="flex-1 text-left">{item.label}</span>

                            {item.hasBadge && getBadgeText() && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                                    {getBadgeText()}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100/50">
                <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition">
                    <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
                    Sair da Conta
                </button>
            </div>
        </aside>
    );
}