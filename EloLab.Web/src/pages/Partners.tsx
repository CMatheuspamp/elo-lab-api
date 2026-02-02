import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    Building2, MapPin, Phone, ArrowRight,
    Search, Star, Plus, LogOut
} from 'lucide-react';
import type { UserSession } from '../types';

interface LaboratorioCard {
    id: string;
    nome: string;
    emailContato: string;
    endereco: string;
    telefone?: string;
}

export function Partners() {
    const navigate = useNavigate();
    const [labs, setLabs] = useState<LaboratorioCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserSession | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const meRes = await api.get('/Auth/me');
            setUser(meRes.data);

            // Se for Clínica, busca os Laboratórios
            if (meRes.data.tipo === 'Clinica') {
                const res = await api.get('/Laboratorios');
                setLabs(res.data);
            } else {
                // Se for Lab, não faz sentido estar aqui, manda pro Dashboard
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem('elolab_token');
        navigate('/');
    }

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Carregando parceiros...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* Header Simples */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">E</div>
                        <span className="text-lg font-bold text-slate-800">EloLab</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-600">Olá, {user?.meusDados.nome}</span>
                        <button onClick={handleLogout} title="Sair">
                            <LogOut className="h-5 w-5 text-slate-400 hover:text-red-600" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto mt-10 max-w-6xl px-6">

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Rede de Parceiros</h1>
                    <p className="mt-2 text-slate-500">Selecione um laboratório para enviar pedidos ou consultar preços.</p>
                </div>

                {/* Grid de Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

                    {/* Card "Encontrar Novo" (Futuro) */}
                    <button className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-blue-400 hover:bg-blue-50 group">
                        <div className="mb-4 rounded-full bg-white p-4 shadow-sm group-hover:scale-110 transition">
                            <Search className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <span className="font-bold text-slate-600 group-hover:text-blue-700">Encontrar Novo Laboratório</span>
                    </button>

                    {/* Lista de Labs Existentes */}
                    {labs.map(lab => (
                        <div key={lab.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
                            <div>
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-slate-400 text-slate-400" /> 4.9
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900">{lab.nome}</h3>
                                <div className="mt-4 space-y-2 text-sm text-slate-500">
                                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {lab.endereco || 'Endereço não informado'}</p>
                                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {lab.emailContato}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => navigate('/trabalhos/novo', { state: { labId: lab.id } })} // <--- AQUI: Passamos o ID via state
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                                >
                                    <Plus className="h-4 w-4" /> Pedido
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')} // Futuro: Ir para dashboard filtrado deste Lab
                                    className="flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Link para ver todos os meus trabalhos (Dashboard Geral) */}
                <div className="mt-12 flex justify-center">
                    <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-slate-400 hover:text-slate-600 hover:underline">
                        Ir para meu painel geral de pedidos &rarr;
                    </button>
                </div>

            </main>
        </div>
    );
}