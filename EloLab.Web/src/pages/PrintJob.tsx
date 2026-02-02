import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2, Printer, Scissors } from 'lucide-react';
import type { Trabalho } from '../types';

export function PrintJob() {
    const { id } = useParams();
    const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/Trabalhos/${id}`)
            .then(res => setTrabalho(res.data))
            .catch(() => alert("Erro ao carregar dados."))
            .finally(() => setLoading(false));
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading || !trabalho) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-white p-8 text-slate-900 print:p-0">

            {/* Botão flutuante para imprimir (some na impressão) */}
            <button
                onClick={handlePrint}
                className="fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-bold text-white shadow-xl transition hover:bg-slate-800 print:hidden"
            >
                <Printer className="h-5 w-5" /> Imprimir Guia
            </button>

            <div className="mx-auto max-w-[210mm] border border-slate-200 p-8 print:max-w-none print:border-none print:p-0">

                {/* Cabeçalho */}
                <div className="mb-8 flex items-start justify-between border-b border-slate-900 pb-6">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Guia de Trabalho</h1>
                        <p className="mt-1 font-mono text-sm text-slate-500">ID: #{trabalho.id.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold">{trabalho.laboratorio?.nome}</h2>
                        {trabalho.laboratorio?.emailContato && <p className="text-sm text-slate-600">{trabalho.laboratorio.emailContato}</p>}
                        {trabalho.laboratorio?.telefone && <p className="text-sm text-slate-600">{trabalho.laboratorio.telefone}</p>}
                        {trabalho.laboratorio?.nif && <p className="text-sm text-slate-600">NIF: {trabalho.laboratorio.nif}</p>}
                    </div>
                </div>

                {/* Dados Principais */}
                <div className="mb-8 grid grid-cols-2 gap-8">
                    <div className="rounded border border-slate-300 p-4">
                        <p className="text-xs font-bold uppercase text-slate-500">Clínica / Dentista</p>
                        <p className="text-xl font-bold">{trabalho.clinica?.nome}</p>
                        <p className="text-sm text-slate-600 mt-1">{trabalho.clinica?.endereco || 'Endereço não informado'}</p>
                    </div>
                    <div className="rounded border border-slate-300 p-4">
                        <p className="text-xs font-bold uppercase text-slate-500">Paciente</p>
                        <p className="text-xl font-bold">{trabalho.pacienteNome}</p>
                        <div className="mt-2 flex gap-4 text-sm">
                            <span><strong>Entrada:</strong> {new Date(trabalho.createdAt).toLocaleDateString()}</span>
                            <span><strong>Saída:</strong> {new Date(trabalho.dataEntregaPrevista).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Especificações Técnicas */}
                <div className="mb-8">
                    <h3 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase">Especificações do Pedido</h3>
                    <table className="w-full text-left text-sm">
                        <thead>
                        <tr className="bg-slate-100">
                            <th className="p-3">Serviço / Produto</th>
                            <th className="p-3">Elementos/Dentes</th>
                            <th className="p-3">Cor</th>
                            <th className="p-3 text-right">Valor Unit.</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr className="border-b border-slate-200">
                            <td className="p-3 font-medium">
                                {trabalho.servico?.nome || 'Trabalho Personalizado'}
                                <span className="block text-xs text-slate-500">{trabalho.servico?.material}</span>
                            </td>
                            <td className="p-3 font-mono text-lg font-bold">{trabalho.dentes || '-'}</td>
                            <td className="p-3 font-bold">{trabalho.corDente || '-'}</td>
                            <td className="p-3 text-right font-mono">
                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(trabalho.valorFinal)}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Observações */}
                <div className="mb-12 rounded bg-slate-50 p-4 print:bg-transparent print:border print:border-slate-200">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Observações / Instruções</p>
                    <p className="text-sm italic text-slate-700 min-h-[3rem]">
                        {trabalho.descricaoPersonalizada || "Sem observações adicionais."}
                    </p>
                </div>

                {/* Rodapé / Assinatura */}
                <div className="mt-auto pt-8">
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex-1 border-t border-slate-400 pt-2 text-center">
                            <p className="text-xs font-bold uppercase text-slate-500">Conferência Laboratório</p>
                        </div>
                        <div className="flex-1 border-t border-slate-400 pt-2 text-center">
                            <p className="text-xs font-bold uppercase text-slate-500">Recebido por (Clínica)</p>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Scissors className="h-3 w-3" />
                        <span className="border-b border-dashed border-slate-300 flex-1"></span>
                        <span>Processado via EloLab Systems</span>
                        <span className="border-b border-dashed border-slate-300 flex-1"></span>
                    </div>
                </div>

            </div>
        </div>
    );
}