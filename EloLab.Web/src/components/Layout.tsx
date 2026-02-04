import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    return (
        <div className="flex min-h-screen bg-transparent"> {/* Fundo transparente */}
            <Sidebar />

            {/* Main transparente para deixar a página filha decidir a cor */}
            <main className="flex-1 ml-64 transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
}