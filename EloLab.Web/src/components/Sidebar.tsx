import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, Building2,
    Tag, UserCircle, LogOut
} from 'lucide-react';

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Lê o tipo que salvamos no Login
    const userType = localStorage.getItem('elolab_user_type');

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', show: true },
        { label: 'Novo Pedido', icon: PlusCircle, path: '/trabalhos/novo', show: true },
        { label: 'Parceiros', icon: Building2, path: '/parceiros', show: true },
        // Só mostra Serviços se for Laboratório ou se o tipo ainda não estiver carregado (previne sumir erradamente)
        { label: 'Serviços & Preços', icon: Tag, path: '/servicos', show: userType === 'Laboratorio' },
        { label: 'Meu Perfil', icon: UserCircle, path: '/perfil', show: true },
    ];

    function handleLogout() {
        localStorage.clear();
        navigate('/');
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col z-20">
            {/* Logo */}
            <div className="flex h-20 items-center gap-3 px-8 border-b border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg shadow-blue-200">
                    E
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">EloLab</span>
            </div>

            {/* Menu */}
            <nav className="flex-1 space-y-1 p-4 py-6">
                {menuItems.filter(i => i.show).map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                            ${isActive(item.path)
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <item.icon className={`h-5 w-5 transition-colors ${isActive(item.path) ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-100">
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