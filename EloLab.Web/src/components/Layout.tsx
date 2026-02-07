import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    return (
        // 'flex' coloca a sidebar ao lado do conteúdo.
        // NÃO uses 'overflow-hidden' aqui, senão cortas o scroll da página.
        <div className="flex min-h-screen bg-slate-50">

            <Sidebar />

            {/* O ml-64 empurra o conteúdo para a direita (espaço da sidebar) */}
            <main className="flex-1 ml-64 relative">
                <Outlet />
            </main>
        </div>
    );
}