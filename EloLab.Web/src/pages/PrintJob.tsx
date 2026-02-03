import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
    Calendar, Printer,
    FileText, Scissors, Building2, User
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

    // === COMPONENTE DA VIA ÚNICA (Reutilizável) ===
    const JobTicket = ({ tipoVia }: { tipoVia: string }) => {
        const labColor = trabalho.laboratorio?.corPrimaria || '#000000';
        const labLogo = trabalho.laboratorio?.logoUrl;

        // Helper URL
        const getFullUrl = (url: string) => {
            if (!url) return '';
            if (url.startsWith('http')) return url;
            const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
            const cleanPath = url.startsWith('/') ? url : `/${url}`;
            return `${baseUrl}${cleanPath}`;
        };

        return (
            <div className="flex h-[135mm] flex-col bg-white text-slate-900 border border-slate-200 p-4 rounded-lg relative overflow-hidden">

                {/* Faixa Colorida Lateral (Identidade Visual) */}
                <div className="absolute left-0 top-0 bottom-0 w-3" style={{ backgroundColor: labColor }}></div>

                <div className="pl-4 flex flex-col h-full">

                    {/* 1. CABEÇALHO (Compacto) */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2">
                        <div className="flex items-center gap-3">
                            {labLogo ? (
                                <img src={getFullUrl(labLogo)} alt="Logo" className="h-10 w-auto object-contain" />
                            ) : (
                                <div className="text-xl font-bold uppercase">{trabalho.laboratorio?.nome}</div>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">{tipoVia}</span>
                            <span className="text-xl font-black">#{trabalho.id.substring(0, 8)}</span>
                        </div>
                    </div>

                    {/* 2. LINHA DE IDENTIFICAÇÃO (Paciente e Clínica) */}
                    <div className="flex gap-4 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="flex-1">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                <User className="h-3 w-3"/> Paciente
                            </span>
                            <span className="block text-lg font-black leading-tight truncate">
                                {trabalho.pacienteNome}
                            </span>
                        </div>
                        <div className="flex-1 border-l border-slate-200 pl-3">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                <Building2 className="h-3 w-3"/> Clínica
                            </span>
                            <span className="block text-base font-bold text-slate-700 truncate">
                                {trabalho.clinica?.nome}
                            </span>
                        </div>
                    </div>

                    {/* 3. DADOS TÉCNICOS (O CORAÇÃO DA GUIA) */}
                    <div className="flex-1 flex flex-col gap-3">

                        {/* SERVIÇO (Destaque Máximo - Não corta) */}
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Serviço Solicitado</span>
                            <div className="border-l-4 p-2 bg-slate-50 border-slate-200" style={{ borderLeftColor: labColor }}>
                                <span className="text-xl font-black leading-tight text-slate-900 break-words">
                                    {trabalho.servico?.nome || "Serviço Personalizado"}
                                </span>
                                <span className="block text-xs font-medium text-slate-500 mt-1">
                                    {trabalho.servico?.material || "Material Padrão"}
                                </span>
                            </div>
                        </div>

                        {/* GRID DENTES E COR */}
                        <div className="flex gap-4">
                            {/* DENTES */}
                            <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Dentes / Elementos</span>
                                <div className="border border-slate-300 rounded p-2 bg-white text-center">
                                    <span className="text-2xl font-mono font-bold tracking-widest text-slate-900">
                                        {trabalho.dentes || "TOTAL"}
                                    </span>
                                </div>
                            </div>

                            {/* COR */}
                            <div className="w-1/3">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Cor / Escala</span>
                                <div className="border border-slate-300 rounded p-2 bg-white text-center">
                                    <span className="text-2xl font-black text-slate-900">
                                        {trabalho.corDente || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DATA ENTREGA (Crucial) */}
                        <div className="mt-1">
                            <div className="flex items-center justify-between border-t border-b border-slate-100 py-2">
                                <span className="text-xs font-bold uppercase text-slate-400">Data de Entrega</span>
                                <div className="flex items-center gap-2 font-bold text-lg" style={{ color: labColor }}>
                                    <Calendar className="h-5 w-5" />
                                    {new Date(trabalho.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. OBSERVAÇÕES (Compactas no rodapé) */}
                    <div className="mt-3">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
                            <FileText className="h-3 w-3"/> Observações
                        </span>
                        <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-2 min-h-[40px]">
                            <p className="text-xs leading-tight text-slate-700 whitespace-pre-wrap line-clamp-3">
                                {trabalho.descricaoPersonalizada || "Sem observações adicionais."}
                            </p>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-2 text-[9px] text-slate-400 text-right">
                        {new Date().toLocaleDateString()} • EloLab
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-200 p-8 print:p-0 print:bg-white flex justify-center">

            {/* Botão Flutuante */}
            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-6 py-4 font-bold text-white shadow-xl hover:bg-slate-800 hover:scale-105 transition print:hidden"
            >
                <Printer className="h-5 w-5" /> Imprimir 2 Vias
            </button>

            {/* Folha A4 Real (Com margens de segurança) */}
            <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none flex flex-col">

                {/* MARGEM DE SEGURANÇA (p-8 = ~3cm, garante que nada corta) */}
                <div className="flex-1 p-8 flex flex-col justify-between">

                    {/* VIA 1 */}
                    <JobTicket tipoVia="Via Laboratório" />

                    {/* LINHA DE CORTE */}
                    <div className="relative flex items-center justify-center py-4">
                        <div className="absolute w-full border-t-2 border-dashed border-slate-300"></div>
                        <div className="relative bg-white px-2 text-slate-300">
                            <Scissors className="h-4 w-4 rotate-90" />
                        </div>
                    </div>

                    {/* VIA 2 */}
                    <JobTicket tipoVia="Via Entrega / Cliente" />

                </div>
            </div>
        </div>
    );
}