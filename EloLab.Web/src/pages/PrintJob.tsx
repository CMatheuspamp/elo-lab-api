import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
    Calendar, Printer,
    FileText, Building2, User
} from 'lucide-react';
import type { Trabalho } from '../types';

export function PrintJob() {
    const { id } = useParams();
    const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/Trabalhos/${id}`)
            .then(res => setTrabalho(res.data))
            .catch(() => alert('Erro ao carregar trabalho'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading || !trabalho) return <div className="p-10 text-center">Carregando guia...</div>;

    // === COMPONENTE DA VIA ÚNICA ===
    const JobTicket = ({ tipoVia }: { tipoVia: string }) => {
        const labColor = trabalho.laboratorio?.corPrimaria || '#000000';
        const labLogo = trabalho.laboratorio?.logoUrl;

        const getFullUrl = (url: string) => {
            if (!url) return '';
            if (url.startsWith('http')) return url;
            const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
            const cleanPath = url.startsWith('/') ? url : `/${url}`;
            return `${baseUrl}${cleanPath}`;
        };

        const formatCurrency = (val: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
        const osNumber = trabalho.id.substring(0, 6).toUpperCase();

        let quantidade = 1;
        const d = trabalho.dentes || "";
        if (d.includes("Boca Completa")) quantidade = 2;
        else if (d.includes("Superior") || d.includes("Inferior")) quantidade = 1;
        else if (d.includes(",")) quantidade = d.split(",").length;
        else if (d.length <= 3 && d.length > 0) quantidade = 1;

        const valorTotal = trabalho.valorFinal;
        const valorUnitario = valorTotal / (quantidade || 1);

        return (
            // AQUI: flex-1 força a ocupar exatamente 50% da altura disponível
            <div className="flex flex-1 flex-col bg-white text-slate-900 border-2 border-slate-800 rounded-lg relative overflow-hidden">

                {/* Faixa Lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-3" style={{ backgroundColor: labColor }}></div>

                {/* Conteúdo Principal */}
                <div className="pl-6 pr-4 py-4 flex flex-col h-full">

                    {/* === 1. CABEÇALHO CENTRALIZADO === */}
                    <div className="relative flex flex-col items-center justify-center border-b-2 border-slate-100 pb-3 mb-3">

                        {/* Tipo de Via (Canto Superior Direito) */}
                        <span className="absolute top-0 right-0 text-[9px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-500 tracking-wider">
                            {tipoVia}
                        </span>

                        {/* Logo Centralizada */}
                        {labLogo ? (
                            <img src={getFullUrl(labLogo)} alt="Logo" className="h-16 w-auto object-contain mb-1" />
                        ) : (
                            <div className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-1">{trabalho.laboratorio?.nome}</div>
                        )}

                        {/* OS Logo Abaixo */}
                        <div className="flex items-center gap-2 mt-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordem de Serviço</span>
                            <span className="text-lg font-mono font-black text-slate-900 leading-none">
                                #{osNumber}
                            </span>
                        </div>
                    </div>

                    {/* 2. DADOS CLIENTE */}
                    <div className="grid grid-cols-2 gap-4 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
                                <Building2 className="h-3 w-3"/> Clínica
                            </span>
                            <span className="font-bold text-lg text-slate-800 leading-tight truncate">{trabalho.clinica?.nome}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200 pl-3">
                            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
                                <User className="h-3 w-3"/> Paciente
                            </span>
                            <span className="font-black text-xl text-slate-900 leading-tight truncate">{trabalho.pacienteNome}</span>
                        </div>
                    </div>

                    {/* 3. DADOS TÉCNICOS */}
                    <div className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3 mb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-bold uppercase text-slate-400">Serviço</span>
                                <div className="text-xl font-black text-slate-900 leading-none mt-0.5">{trabalho.servico?.nome || "Personalizado"}</div>
                                <div className="text-sm font-bold text-slate-500">{trabalho.servico?.material || "Material Padrão"}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Entrega</span>
                                <div className="flex items-center justify-end gap-1 font-bold text-lg" style={{ color: labColor }}>
                                    <Calendar className="h-5 w-5" />
                                    {new Date(trabalho.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 bg-slate-50 rounded border border-slate-200 px-2 py-1">
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Dentes</span>
                                <span className="font-mono font-bold text-base text-slate-800 break-words leading-tight">
                                    {trabalho.dentes || "N/A"}
                                </span>
                            </div>
                            <div className="bg-slate-50 rounded border border-slate-200 px-2 py-1 text-center">
                                <span className="text-[9px] font-bold uppercase text-slate-400 block">Cor</span>
                                <span className="font-black text-xl text-slate-900 leading-tight">{trabalho.corDente || "?"}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                            <div className="flex gap-4 text-[10px] text-slate-500 font-medium">
                                <span>Qtd: <b>{quantidade}</b></span>
                                <span>Unit: <b>{formatCurrency(valorUnitario)}</b></span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Total</span>
                                <span className="text-xl font-black text-slate-900 leading-none">{formatCurrency(valorTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. OBSERVAÇÕES (Ocupa o resto do espaço - flex-1) */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                            <FileText className="h-3 w-3"/> Observações
                        </span>

                        <div className="flex-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/30 p-3 relative">
                            {trabalho.descricaoPersonalizada && (
                                <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
                                    {trabalho.descricaoPersonalizada}
                                </p>
                            )}
                            {/* Se não houver obs, a div fica vazia e limpa para escrever */}
                        </div>
                    </div>

                    {/* Footer Minimalista */}
                    <div className="mt-2 flex justify-between text-[8px] text-slate-400 uppercase tracking-wider">
                        <span>EloLab System</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-200 p-8 print:p-0 print:bg-white flex justify-center font-sans">

            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-6 py-4 font-bold text-white shadow-xl hover:bg-slate-800 hover:scale-105 transition print:hidden"
            >
                <Printer className="h-5 w-5" /> Imprimir
            </button>

            {/* Folha A4 - Full Bleed */}
            <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none flex flex-col p-2">

                {/* VIA 1 */}
                <JobTicket tipoVia="Via Laboratório" />

                {/* Divisor Simples */}
                <div className="border-b-2 border-dashed border-slate-300 my-1 w-full opacity-50"></div>

                {/* VIA 2 */}
                <JobTicket tipoVia="Via Cliente" />

            </div>
        </div>
    );
}