import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, Building2,
    Tag, UserCircle, LogOut, Users, Bell, ScrollText, CalendarDays, Wallet
} from 'lucide-react';
import { api } from '../services/api';

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Recupera dados
    const userType = localStorage.getItem('elolab_user_type');

    // === "WHITE LABEL" LÓGICA ===
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';
    const logoUrl = localStorage.getItem('elolab_user_logo');
    // ============================

    // === LÓGICA DO CONTADOR (BADGE) ===
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        async function fetchCount() {
            try {
                // Busca notificações para contar as não lidas
                const res = await api.get('/Notificacoes');
                const count = res.data.filter((n: any) => !n.lida).length;
                setUnreadCount(count);
            } catch (e) {
                // Silencioso se falhar, para não poluir o console
            }
        }

        fetchCount(); // Chama na montagem
        const interval = setInterval(fetchCount, 30000); // Atualiza a cada 30s

        return () => clearInterval(interval);
    }, [location.pathname]); // Atualiza também ao mudar de página (ex: ao sair das notificações)

    const getBadgeText = () => {
        if (unreadCount === 0) return null;
        return unreadCount > 5 ? '5+' : unreadCount;
    };
    // ==================================

    // === ESTILO GRADIENTE ===
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

    // === DEFINIÇÃO DOS ITENS DO MENU ===
    const menuItems = [
        // 1. Dashboard (Só Laboratório)
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: '/dashboard',
            show: userType === 'Laboratorio'
        },
        // 2. Minhas Clínicas (Só Laboratório)
        {
            label: 'Minhas Clínicas',
            icon: Users,
            path: '/clinicas',
            show: userType === 'Laboratorio'
        },
        // 3. Meus Laboratórios (Só Clínica)
        {
            label: 'Meus Laboratórios',
            icon: Building2,
            path: '/parceiros',
            show: userType === 'Clinica'
        },
        // 4. Novo Pedido (Para todos)
        {
            label: 'Novo Pedido',
            icon: PlusCircle,
            path: '/trabalhos/novo',
            show: true
        },
        // 5. Serviços (Só Lab)
        {
            label: 'Serviços & Preços',
            icon: Tag,
            path: '/servicos',
            show: userType === 'Laboratorio'
        },
        {
            label: 'Tabelas de Preços',
            icon: ScrollText,
            path: '/tabelas',
            show: userType === 'Laboratorio'
        },
        // === 7. FINANCEIRO (Só Lab) ===
        {
            label: 'Financeiro',
            icon: Wallet,
            path: '/financeiro',
            show: userType === 'Laboratorio'
        },
        // 6. Agenda (Só Lab)
        {
            label: 'Agenda',
            icon: CalendarDays,
            path: '/agenda',
            show: userType === 'Laboratorio'
        },
        // === 8. NOTIFICAÇÕES (COM BADGE) ===
        {
            label: 'Notificações',
            icon: Bell,
            path: '/notificacoes',
            show: true,
            hasBadge: true // <--- Marcador para renderizar a bolinha
        },
        // 9. Perfil (Para todos)
        {
            label: 'Meu Perfil',
            icon: UserCircle,
            path: '/perfil',
            show: true
        },
    ];

    function handleLogout() {
        localStorage.clear();
        navigate('/');
    }

    return (
        <aside
            className="fixed left-0 top-0 h-screen w-64 flex flex-col z-20 transition-all duration-300"
            style={sidebarStyle}
        >
            {/* LOGO AREA - Aumentámos o espaço de h-40 para h-48 */}
            <div className="flex h-48 flex-col items-center justify-center border-b border-slate-100/50 px-6 py-6">
                {logoUrl ? (
                    <img
                        src={getFullUrl(logoUrl)}
                        alt="Logo"
                        // Custom logo maior (max-h-40)
                        className="max-h-40 w-auto max-w-full object-contain drop-shadow-sm transition-transform hover:scale-105"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3 w-full h-full justify-center">
                        <img
                            src="/logo.png"
                            alt="EloLab Systems"
                            // Logo padrão maior (max-h-32)
                            className="max-h-32 w-auto max-w-full object-contain drop-shadow-sm transition-transform hover:scale-105"
                        />
                    </div>
                )}
            </div>

            {/* Menu Items */}
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
                            <item.icon
                                className={`h-5 w-5 transition-colors`}
                                style={active ? { color: primaryColor } : {}}
                            />

                            {/* Texto do botão agora num span flex-1 para empurrar o badge */}
                            <span className="flex-1 text-left">{item.label}</span>

                            {/* Renderização do Badge (Contador) */}
                            {item.hasBadge && getBadgeText() && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
                                    {getBadgeText()}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100/50">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                >
                    <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
                    Sair da Conta
                </button>
            </div>
        </aside>
    );
}