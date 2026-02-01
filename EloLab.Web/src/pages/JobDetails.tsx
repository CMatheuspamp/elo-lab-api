import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Building2, CheckCircle, Clock, FileText, Loader2, Play, Package, Euro } from 'lucide-react';
import type { Trabalho } from '../types';

export function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Carrega os dados ao abrir
    useEffect(() => {
        api.get(`/Trabalhos/${id}`)
            .then(response => setTrabalho(response.data))
            .catch(() => navigate('/dashboard'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    // Função para mudar o status
    async function changeStatus(novoStatus: string) {
        if (!trabalho) return;
        setUpdating(true);
        try {
            await api.patch(`/Trabalhos/${trabalho.id}/status`, JSON.stringify(novoStatus), {
                headers: { 'Content-Type': 'application/json' }
            });
            // Atualiza a tela localmente
            setTrabalho({ ...trabalho, status: novoStatus as any });
        } catch (error) {
            alert('Erro ao atualizar status');
        } finally {
            setUpdating(false);
        }
    }

    if (loading || !trabalho) {
        return <div className="flex h-screen items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
    }

    // Definição visual dos Status
    const isPendente = trabalho.status === 'Pendente';
    const isProducao = trabalho.status === 'EmProducao';
    const isConcluido = trabalho.status === 'Concluido';

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-4xl">

                {/* Botão Voltar */}
                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </button>

                {/* Header Principal */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{trabalho.pacienteNome}</h1>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono text-slate-500">
                #{trabalho.id.substring(0, 8)}
              </span>
                        </div>
                        <p className="mt-1 text-slate-500 flex items-center gap-2">
                            <Building2 className="h-4 w-4"/> {trabalho.clinica?.nome || 'Clínica Parceira'}
                        </p>
                    </div>

                    {/* Botões de Ação (Workflow) */}
                    <div className="flex gap-2">
                        {isPendente && (
                            <button
                                onClick={() => changeStatus('EmProducao')}
                                disabled={updating}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {updating ? <Loader2 className="animate-spin h-4 w-4"/> : <Play className="h-4 w-4" />} Iniciar Produção
                            </button>
                        )}

                        {isProducao && (
                            <button
                                onClick={() => changeStatus('Concluido')}
                                disabled={updating}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {updating ? <Loader2 className="animate-spin h-4 w-4"/> : <CheckCircle className="h-4 w-4" />} Concluir Trabalho
                            </button>
                        )}

                        {isConcluido && (
                            <button
                                disabled
                                className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 cursor-default"
                            >
                                <Package className="h-4 w-4" /> Pronto para Entrega
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid de Detalhes */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">

                    {/* Coluna 1: Técnico */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Especificações</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500">Serviço</label>
                                <p className="font-medium text-slate-900">{trabalho.servico?.nome || 'Personalizado'}</p>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <label className="text-xs text-slate-500">Dentes</label>
                                    <p className="font-medium text-slate-900">{trabalho.dentes || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Cor</label>
                                    <p className="font-medium text-slate-900">{trabalho.corDente || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: Datas e Obs */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Planeamento</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 rounded-full bg-orange-50 p-2 text-orange-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Data de Entrega</label>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {new Date(trabalho.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(trabalho.dataEntregaPrevista).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 rounded-full bg-emerald-50 p-2 text-emerald-600">
                                    <Euro className="h-5 w-5" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Valor Final</label>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(trabalho.valorFinal)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {trabalho.descricaoPersonalizada && (
                            <div className="mt-6 border-t border-slate-100 pt-4">
                                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                    <FileText className="h-3 w-3" /> Observações
                                </label>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {trabalho.descricaoPersonalizada}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}