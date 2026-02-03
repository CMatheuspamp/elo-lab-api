import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    // 1. Ler a cor da marca
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    return (
        <div
            className="min-h-screen"
            style={{
                // Aumentei a opacidade de 0D (5%) para 26 (15%)
                // Fica mais "presente" mas continua suave para leitura
                background: `linear-gradient(180deg, ${primaryColor}26 0%, #f8fafc 100%)`,
                backgroundColor: '#f8fafc'
            }}
        >
            {/* Sidebar Fixa */}
            <Sidebar />

            {/* Conteúdo à direita com margem */}
            <main className="pl-64 transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
}