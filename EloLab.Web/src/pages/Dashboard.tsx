import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Building2, Calendar, Search, Plus, Tag,
    TrendingUp, AlertCircle, Clock, CheckCircle, Wallet
} from 'lucide-react';
import type { UserSession, Trabalho } from '../types';

export function Dashboard() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Formatações
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
    };

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
                const meResponse = await api.get('/Auth/me');
                setUser(meResponse.data);

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

    const isLab = user?.tipo === 'Laboratorio';

    // Cálculos
    const pendentes = trabalhos.filter(t => t.status === 'Pendente').length;
    const emProducao = trabalhos.filter(t => t.status === 'EmProducao').length;
    const concluidos = trabalhos.filter(t => t.status === 'Concluido').length;
    const totalValor = trabalhos.reduce((acc, t) => acc + t.valorFinal, 0);

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

                        {!isLab && (
                            <button
                                onClick={() => navigate('/parceiros')}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                                <Building2 className="h-3.5 w-3.5" /> Rede de Parceiros
                            </button>
                        )}

                        {isLab && (
                            <button
                                onClick={() => navigate('/servicos')}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                                <Tag className="h-3.5 w-3.5" /> Tabela de Preços
                            </button>
                        )}

                        {/* Botão de Perfil */}
                        <div
                            className="text-right cursor-pointer hover:opacity-80 transition group"
                            onClick={() => navigate('/perfil')}
                            title="Editar Perfil"
                        >
                            <p className="text-sm font-semibold text-slate-900">{user.meusDados.nome}</p>
                            <p className="text-xs text-slate-500 group-hover:text-blue-600 group-hover:underline">Meu Perfil</p>
                        </div>

                        <button onClick={handleLogout} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto mt-8 max-w-6xl px-6">

                {/* Título */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Trabalhos</h1>
                        <p className="text-slate-500">
                            {isLab ? 'Visão geral da produção' : 'Acompanhe seus pedidos'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/trabalhos/novo')}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition">
                        <Plus className="h-4 w-4" /> Novo Pedido
                    </button>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">

                    <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    {isLab ? 'Faturamento Total' : 'Total em Pedidos'}
                                </p>
                                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                    {formatCurrency(totalValor)}
                                </h3>
                            </div>
                            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                                {isLab ? <TrendingUp className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    {isLab ? 'Novos Pedidos' : 'Aguardando Início'}
                                </p>
                                <h3 className="mt-2 text-2xl font-bold text-slate-900">{pendentes}</h3>
                            </div>
                            <div className="rounded-full bg-orange-50 p-3 text-orange-600">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Em Produção
                                </p>
                                <h3 className="mt-2 text-2xl font-bold text-slate-900">{emProducao}</h3>
                            </div>
                            <div className="rounded-full bg-purple-50 p-3 text-purple-600">
                                <Clock className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    {isLab ? 'Concluídos' : 'Prontos'}
                                </p>
                                <h3 className="mt-2 text-2xl font-bold text-slate-900">{concluidos}</h3>
                            </div>
                            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabela */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                                            {isLab ? trabalho.clinica?.nome : trabalho.laboratorio?.nome}
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
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/trabalhos/${trabalho.id}`)}
                                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            Ver
                                        </button>
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