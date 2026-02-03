import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar Fixa */}
            <Sidebar />

            {/* Conteúdo à direita (pl-64 cria o espaço para a sidebar) */}
            <main className="pl-64 transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
}