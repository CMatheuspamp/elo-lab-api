import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    Building2, MapPin, Phone, ArrowRight,
    Search, Star, Plus
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
    const [, setUser] = useState<UserSession | null>(null); // user apenas para check inicial

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const meRes = await api.get('/Auth/me');
            setUser(meRes.data);

            if (meRes.data.tipo === 'Clinica') {
                const res = await api.get('/Laboratorios');
                setLabs(res.data);
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-slate-400">Carregando parceiros...</div>;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Rede de Parceiros</h1>
                <p className="text-slate-500">Selecione um laboratório para enviar pedidos.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Botão Adicionar */}
                <button className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 transition hover:border-blue-400 hover:bg-blue-50 group">
                    <div className="mb-4 rounded-full bg-white p-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition duration-300">
                        <Search className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-600 group-hover:text-blue-700">Adicionar Novo Parceiro</span>
                </button>

                {/* Lista */}
                {labs.map(lab => (
                    <div key={lab.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                        <div>
                            <div className="mb-4 flex items-start justify-between">
                                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                    <Building2 className="h-8 w-8" />
                                </div>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-slate-400 text-slate-400" /> 4.9
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{lab.nome}</h3>
                            <div className="mt-4 space-y-2.5 text-sm text-slate-500">
                                <p className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-slate-300" /> <span className="truncate">{lab.endereco || 'Localização não inf.'}</span></p>
                                <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-slate-300" /> {lab.telefone || 'Sem telefone'}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 pt-4 border-t border-slate-50">
                            <button
                                onClick={() => navigate('/trabalhos/novo', { state: { labId: lab.id } })}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-200"
                            >
                                <Plus className="h-4 w-4" /> Pedido
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}