import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, Building2,
    Tag, UserCircle, LogOut
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
        // 2. Parceiros (AGORA: Só Clínica vê isto)
        {
            label: 'Meus Laboratórios', // Mudei o nome para ficar mais claro para a clínica
            icon: Building2,
            path: '/parceiros',
            show: userType === 'Clinica' // <--- ALTERAÇÃO AQUI: O Lab não vê mais
        },
        // 3. Novo Pedido (Para todos)
        {
            label: 'Novo Pedido',
            icon: PlusCircle,
            path: '/trabalhos/novo',
            show: true
        },
        // 4. Serviços (Só Lab)
        {
            label: 'Serviços & Preços',
            icon: Tag,
            path: '/servicos',
            show: userType === 'Laboratorio'
        },
        // 5. Perfil (Para todos)
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
            {/* LOGO AREA */}
            <div className="flex h-40 flex-col items-center justify-center border-b border-slate-100/50 px-6 py-6">
                {logoUrl ? (
                    <img
                        src={getFullUrl(logoUrl)}
                        alt="Logo"
                        className="max-h-28 w-auto max-w-full object-contain drop-shadow-sm transition-transform hover:scale-105"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white shadow-lg text-2xl"
                            style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px ${primaryColor}50` }}
                        >
                            E
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">EloLab</span>
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
                            {item.label}
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