import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {LogOut, Building2, User, Activity, Loader2} from 'lucide-react';

export function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/Auth/me')
            .then(response => setUser(response.data))
            .catch(() => navigate('/'));
    }, [navigate]);

    function handleLogout() {
        localStorage.removeItem('elolab_token');
        navigate('/');
    }

    if (!user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar Superior */}
            <header className="border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                            E
                        </div>
                        <span className="text-lg font-bold text-slate-800">EloLab</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col text-right">
                            <span className="text-sm font-medium text-slate-900">{user.meusDados?.nome || 'Usuário'}</span>
                            <span className="text-xs text-slate-500">{user.tipo}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            title="Sair"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="mx-auto mt-8 max-w-6xl px-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
                    <p className="text-slate-500">Resumo das atividades da sua conta.</p>
                </div>

                {/* Grid de Informações (Cards) */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                    {/* Card 1: Perfil */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase">Organização</h3>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{user.meusDados?.nome}</p>
                    </div>

                    {/* Card 2: ID do Usuário */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <User className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase">Usuário Responsável</h3>
                        <p className="mt-1 text-sm font-mono text-slate-700 truncate">{user.seuId}</p>
                    </div>

                    {/* Card 3: Status (Fictício por enquanto) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Activity className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase">Status do Sistema</h3>
                        <p className="mt-1 text-xl font-semibold text-emerald-600">Operacional</p>
                    </div>

                </div>
            </main>
        </div>
    );
}