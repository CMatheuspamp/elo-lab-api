import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import {
    MapPin, Phone, ArrowRight, Building2, Plus
} from 'lucide-react';

interface LaboratorioCard {
    id: string;
    nome: string;
    emailContato: string;
    endereco: string;
    telefone?: string;
    logoUrl?: string;
    corPrimaria?: string;
}

export function Partners() {
    const navigate = useNavigate();
    const [labs, setLabs] = useState<LaboratorioCard[]>([]);
    const [loading, setLoading] = useState(true);

    const myColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanPath}`;
    };

    useEffect(() => {
        async function loadData() {
            try {
                const meRes = await api.get('/Auth/me');
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
        loadData();
    }, [navigate]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>;

    return (
        <PageContainer primaryColor={myColor}>

            {/* CORREÇÃO DE LAYOUT: Removido mx-auto, agora ocupa largura total e encosta à esquerda */}
            <div className="w-full ml-0">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Meus Laboratórios</h1>
                    <p className="text-slate-500">Selecione um laboratório para acessar o painel de pedidos.</p>
                </div>

                {labs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-20 text-center">
                        <Building2 className="mb-4 h-12 w-12 text-slate-300" />
                        <h3 className="text-lg font-bold text-slate-600">Nenhum parceiro conectado</h3>
                        <p className="max-w-md text-sm text-slate-400 mt-2">Peça o link de convite ao seu laboratório.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {labs.map(lab => {
                            const labColor = lab.corPrimaria || '#2563EB';

                            return (
                                <div
                                    key={lab.id}
                                    onClick={() => navigate(`/portal/${lab.id}`)}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                                >
                                    <div className="absolute left-0 top-0 h-2 w-full" style={{ backgroundColor: labColor }} />

                                    <div>
                                        <div className="mb-6 flex items-start justify-between">
                                            {/* LOGO MAIOR */}
                                            <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm flex items-center justify-center p-2">
                                                {lab.logoUrl ? (
                                                    <img src={getFullUrl(lab.logoUrl)} alt={lab.nome} className="h-full w-full object-contain" />
                                                ) : (
                                                    <span className="text-3xl font-bold" style={{ color: labColor }}>{lab.nome.charAt(0)}</span>
                                                )}
                                            </div>

                                            <div className="rounded-full bg-slate-50 p-2 text-slate-300 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                                                <ArrowRight className="h-6 w-6" />
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition mb-2">
                                            {lab.nome}
                                        </h3>

                                        <div className="space-y-3 text-sm text-slate-500">
                                            <p className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-slate-300" /> <span className="truncate">{lab.endereco || 'Localização n/d'}</span></p>
                                            <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-slate-300" /> {lab.telefone || 'Sem telefone'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-50">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/trabalhos/novo', {
                                                    state: { preSelectedLabId: lab.id, preSelectedLabColor: labColor }
                                                });
                                            }}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition shadow-md hover:shadow-lg hover:opacity-90"
                                            style={{ backgroundColor: labColor }}
                                        >
                                            <Plus className="h-5 w-5" /> Novo Pedido
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}