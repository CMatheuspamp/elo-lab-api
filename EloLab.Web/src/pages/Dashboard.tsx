import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, Calendar, Search, Plus } from 'lucide-react';
import type { UserSession, Trabalho } from '../types';

export function Dashboard() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Função auxiliar para formatar datas (Ex: 10/02/2026)
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Função auxiliar para formatar dinheiro (Ex: € 150,00)
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
    };

    // Função para definir a cor da etiqueta de status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'EmProducao': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Concluido': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Busca dados do usuário
                const meResponse = await api.get('/Auth/me');
                setUser(meResponse.data);

                // 2. Busca lista de trabalhos
                const trabalhosResponse = await api.get('/Trabalhos');
                setTrabalhos(trabalhosResponse.data);

            } catch (error) {
                navigate('/');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [navigate]);

    function handleLogout() {
        localStorage.removeItem('elolab_token');
        navigate('/');
    }

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center text-slate-400">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">E</div>
                        <span className="text-lg font-bold text-slate-800">EloLab</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">{user.meusDados.nome}</p>
                            <p className="text-xs text-slate-500">{user.tipo}</p>
                        </div>
                        <button onClick={handleLogout} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo */}
            <main className="mx-auto mt-8 max-w-6xl px-6">

                {/* Barra de Ações */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Trabalhos</h1>
                        <p className="text-slate-500">Gerencie seus pedidos e produções</p>
                    </div>
                    <button
                        onClick={() => navigate('/trabalhos/novo')}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition">
                        <Plus className="h-4 w-4" /> Novo Pedido
                    </button>
                </div>

                {/* Tabela de Trabalhos */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {/* Filtros rápidos (Fake por enquanto) */}
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3">
                        <div className="relative max-w-sm">
                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar paciente ou ID..."
                                className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {trabalhos.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <p>Nenhum trabalho encontrado.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Paciente</th>
                                <th className="px-6 py-4">Serviço / Detalhes</th>
                                <th className="px-6 py-4">Parceiro</th>
                                <th className="px-6 py-4">Entrega</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {trabalhos.map((trabalho) => (
                                <tr key={trabalho.id} className="hover:bg-slate-50/80 transition">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {trabalho.pacienteNome}
                                        <span className="block text-xs font-normal text-slate-400">ID: {trabalho.id.substring(0, 8)}...</span>
                                    </td>

                                    {/* MUDANÇA AQUI: Exibição mais bonita do Serviço + Dentes + Cor */}
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">
                                            {trabalho.servico?.nome || 'Serviço Personalizado'}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            {trabalho.dentes ? `Dentes: ${trabalho.dentes}` : 'Sem dentes espec.'}
                                            {trabalho.corDente && (
                                                <span className="ml-2 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-medium text-slate-600">
                                                    Cor: {trabalho.corDente}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            {/* Se sou Lab, mostro a Clínica. Se sou Clínica, mostro o Lab */}
                                            {user.tipo === 'Laboratorio' ? trabalho.clinica?.nome : trabalho.laboratorio?.nome}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {formatDate(trabalho.dataEntregaPrevista)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {formatCurrency(trabalho.valorFinal)}
                                    </td>
                                    <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(trabalho.status)}`}>
                                        {trabalho.status}
                                    </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                                        Ver
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}