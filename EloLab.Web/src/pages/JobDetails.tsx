import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
    ArrowLeft, Building2, CheckCircle, FileText, Loader2, Play,
    Package, Euro, Paperclip, UploadCloud, Trash2, Send, MessageSquare,
    Calendar, User, AlertCircle
} from 'lucide-react';
import type { Trabalho } from '../types';

// Interfaces Locais
interface Anexo {
    id: string;
    nomeArquivo: string;
    url: string;
    createdAt: string;
}

interface Mensagem {
    id: string;
    nomeRemetente: string;
    texto: string;
    createdAt: string;
    remetenteId: string;
}

export function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados de Dados
    const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
    const [anexos, setAnexos] = useState<Anexo[]>([]);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);

    // Auth e Permissões
    const [meuId, setMeuId] = useState<string>('');
    const [souLaboratorio, setSouLaboratorio] = useState(false);

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [updating, setUpdating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);

    // Inputs e Refs
    const [novoTexto, setNovoTexto] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Controle de Scroll
    const prevMensagensLength = useRef(0);

    useEffect(() => {
        loadData();
    }, [id, navigate]);

    // Polling do Chat
    useEffect(() => {
        if (!id) return;
        const interval = setInterval(() => {
            loadMensagens(false);
        }, 3000);
        return () => clearInterval(interval);
    }, [id]);

    // Scroll automático apenas se houver nova mensagem
    useEffect(() => {
        if (mensagens.length > prevMensagensLength.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMensagensLength.current = mensagens.length;
    }, [mensagens]);

    async function loadData() {
        try {
            // 1. Identificar Usuário
            const meRes = await api.get('/Auth/me');
            const dadosUser = meRes.data;

            const myId = dadosUser.meusDados.usuarioId || dadosUser.id;
            setMeuId(myId);
            setSouLaboratorio(dadosUser.tipo === 'Laboratorio');

            // 2. Trabalho
            const workResponse = await api.get(`/Trabalhos/${id}`);
            setTrabalho(workResponse.data);

            // 3. Anexos
            try {
                const filesResponse = await api.get(`/Anexos/trabalho/${id}`);
                setAnexos(filesResponse.data);
            } catch (e) { console.log("Sem anexos ou erro ao buscar anexos"); }

            // 4. Mensagens
            await loadMensagens(true);

        } catch (error: any) {
            console.error(error);
            setErroCarregamento("Não foi possível carregar os detalhes. Verifique o ID.");
        } finally {
            setLoading(false);
        }
    }

    async function loadMensagens(showError = false) {
        if(!id) return;
        try {
            const msgResponse = await api.get(`/Mensagens/trabalho/${id}`);
            setMensagens(msgResponse.data);
        } catch (err) {
            if(showError) console.error("Erro ao carregar mensagens");
        }
    }

    async function changeStatus(novoStatus: string) {
        if (!trabalho) return;
        setUpdating(true);
        try {
            await api.patch(`/Trabalhos/${trabalho.id}/status`, JSON.stringify(novoStatus), {
                headers: { 'Content-Type': 'application/json' }
            });
            setTrabalho({ ...trabalho, status: novoStatus as any });
        } catch (error) {
            alert('Erro ao atualizar status');
        } finally {
            setUpdating(false);
        }
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files || event.target.files.length === 0 || !trabalho) return;
        const file = event.target.files[0];
        setUploading(true);

        const formData = new FormData();
        formData.append('trabalhoId', trabalho.id);
        formData.append('arquivo', file);

        try {
            await api.post('/Anexos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const filesResponse = await api.get(`/Anexos/trabalho/${trabalho.id}`);
            setAnexos(filesResponse.data);
        } catch (error) {
            alert("Erro ao enviar arquivo.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if(!novoTexto.trim() || !trabalho) return;
        setSendingMsg(true);
        try {
            await api.post('/Mensagens', { trabalhoId: trabalho.id, texto: novoTexto });
            setNovoTexto('');
            loadMensagens();
        } catch(error) {
            console.error(error);
        } finally {
            setSendingMsg(false);
        }
    }

    async function handleDeleteAnexo(anexoId: string) {
        if(!confirm("Tem certeza?")) return;
        try {
            await api.delete(`/Anexos/${anexoId}`);
            setAnexos(anexos.filter(a => a.id !== anexoId));
        } catch (error) { alert("Erro ao excluir."); }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
    }

    if (!trabalho || erroCarregamento) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-slate-500">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p>{erroCarregamento || "Trabalho não encontrado."}</p>
                <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">Voltar ao Dashboard</button>
            </div>
        );
    }

    const isPendente = trabalho.status === 'Pendente';
    const isProducao = trabalho.status === 'EmProducao';
    const isConcluido = trabalho.status === 'Concluido';

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            <div className="mx-auto max-w-7xl">

                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                </button>

                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-slate-900">{trabalho.pacienteNome}</h1>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-mono font-medium text-slate-500">
                                #{trabalho.id.substring(0, 8)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-slate-500">
                            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-blue-500"/> {trabalho.clinica?.nome || 'Clínica Parceira'}</span>
                            <span className="hidden md:inline text-slate-300">|</span>
                            <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> {trabalho.laboratorio?.nome || 'Meu Lab'}</span>
                        </div>
                    </div>

                    {/* Workflow Actions */}
                    <div className="flex gap-3">
                        {!souLaboratorio && (
                            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-600 border border-slate-200">
                                Status: {trabalho.status}
                            </div>
                        )}

                        {souLaboratorio && isPendente && (
                            <button onClick={() => changeStatus('EmProducao')} disabled={updating} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50">
                                {updating ? <Loader2 className="animate-spin h-5 w-5"/> : <Play className="h-5 w-5" />} Iniciar Produção
                            </button>
                        )}
                        {souLaboratorio && isProducao && (
                            <button onClick={() => changeStatus('Concluido')} disabled={updating} className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 shadow-lg shadow-green-200 transition disabled:opacity-50">
                                {updating ? <Loader2 className="animate-spin h-5 w-5"/> : <CheckCircle className="h-5 w-5" />} Concluir Trabalho
                            </button>
                        )}
                        {isConcluido && (
                            <button disabled className="flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-500 cursor-default border border-slate-200">
                                <Package className="h-5 w-5" /> Pronto para Entrega
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* COLUNA ESQUERDA (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Ficha Técnica */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                                <FileText className="h-4 w-4" /> Ficha Técnica
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase">Serviço Solicitado</label>
                                        <p className="mt-1 text-lg font-medium text-slate-900">{trabalho.servico?.nome || 'Serviço Personalizado'}</p>
                                    </div>
                                    <div className="flex gap-8">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase">Dentes</label>
                                            <p className="mt-1 text-xl font-bold text-slate-900">{trabalho.dentes || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase">Cor / Escala</label>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200">
                                                    {trabalho.corDente || '?'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-5 border border-slate-100">
                                    <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                        <AlertCircle className="h-3 w-3" /> Observações
                                    </label>
                                    <p className="text-sm leading-relaxed text-slate-600">
                                        {trabalho.descricaoPersonalizada || 'Nenhuma observação adicional.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Arquivos */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                                    <Paperclip className="h-4 w-4" /> Arquivos do Caso (STL/Fotos)
                                </h3>
                                <div className="flex gap-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.stl,.obj" />
                                    <button
                                        disabled={uploading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition disabled:opacity-50"
                                    >
                                        {uploading ? <Loader2 className="h-3 w-3 animate-spin"/> : <UploadCloud className="h-3 w-3" />}
                                        Upload
                                    </button>
                                </div>
                            </div>

                            {anexos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 py-10">
                                    <UploadCloud className="h-10 w-10 text-slate-300 mb-2" />
                                    <p className="text-sm font-medium text-slate-400">Nenhum arquivo anexado</p>
                                    <p className="text-xs text-slate-300">Arraste ou clique no botão acima</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {anexos.map(anexo => (
                                        <div key={anexo.id} className="group relative flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm">
                                            <a href={anexo.url} target="_blank" rel="noreferrer" className="flex flex-1 items-center gap-3 overflow-hidden">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm group-hover:text-blue-500">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="truncate text-sm font-bold text-slate-700 group-hover:text-blue-700">{anexo.nomeArquivo}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(anexo.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </a>
                                            <button onClick={() => handleDeleteAnexo(anexo.id)} className="ml-2 rounded-full p-2 text-slate-300 hover:bg-white hover:text-red-500 hover:shadow-sm transition">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUNA DIREITA (1/3) */}
                    <div className="space-y-6">
                        {/* Planeamento */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Planeamento</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 rounded-xl border border-orange-100 bg-orange-50 p-4">
                                    <div className="rounded-full bg-white p-2 text-orange-500 shadow-sm">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-orange-800 opacity-70">Entrega</p>
                                        <p className="font-bold text-slate-900">
                                            {new Date(trabalho.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                    <div className="rounded-full bg-white p-2 text-emerald-500 shadow-sm">
                                        <Euro className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-emerald-800 opacity-70">Valor Total</p>
                                        <p className="font-bold text-slate-900">
                                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(trabalho.valorFinal)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat */}
                        <div className="flex h-[500px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/80 p-4 backdrop-blur-sm">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                    Chat do Pedido
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                {mensagens.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-xs text-center">Nenhuma mensagem ainda.</p>
                                    </div>
                                )}
                                {mensagens.map(msg => {
                                    const isMe = msg.remetenteId === meuId;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                                isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                                            }`}>
                                                <p>{msg.texto}</p>
                                            </div>
                                            <span className="mt-1 px-1 text-[10px] font-medium text-slate-400">
                                                {isMe ? 'Você' : msg.nomeRemetente} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3 bg-white">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={novoTexto}
                                        onChange={e => setNovoTexto(e.target.value)}
                                        placeholder="Digite uma mensagem..."
                                        className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-slate-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendingMsg || !novoTexto.trim()}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm hover:shadow-md"
                                    >
                                        {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 ml-0.5" />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}