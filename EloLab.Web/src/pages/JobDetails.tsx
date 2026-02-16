import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    ArrowLeft, Building2, CheckCircle, FileText, Loader2, Play,
    Package, Euro, Paperclip, UploadCloud, Trash2, Send, MessageSquare,
    Calendar, User, AlertCircle, Printer, Eye, Download, FileBox,
    Image as ImageIcon, File, Undo2
} from 'lucide-react';
import type { Trabalho } from '../types';
import { StlViewer } from '../components/StlViewer';

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

    const [brandColor, setBrandColor] = useState('#2563EB');

    const getBaseUrl = () => {
        const baseURL = api.defaults.baseURL || '';
        return baseURL.replace(/\/api\/?$/, '');
    };

    function getFullUrl(url: string) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${getBaseUrl()}${cleanPath}`;
    }

    const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
    const [anexos, setAnexos] = useState<Anexo[]>([]);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [stlParaVisualizar, setStlParaVisualizar] = useState<string | null>(null);
    const [meuId, setMeuId] = useState<string>('');
    const [souLaboratorio, setSouLaboratorio] = useState(false);

    const [loading, setLoading] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [updating, setUpdating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);

    // Modal de Confirmação Exclusão Anexo
    const [anexoParaExcluir, setAnexoParaExcluir] = useState<string | null>(null);

    const [novoTexto, setNovoTexto] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [id, navigate]);

    useEffect(() => {
        if (!id) return;
        const channel = supabase
            .channel(`chat_trabalho_${id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `trabalho_id=eq.${id}` }, (payload) => {
                const novaDoDB = payload.new as any;
                const novaMsgFormatada: Mensagem = {
                    id: novaDoDB.id,
                    texto: novaDoDB.conteudo,
                    nomeRemetente: novaDoDB.nome_remetente,
                    remetenteId: novaDoDB.remetente_id,
                    createdAt: novaDoDB.created_at
                };
                setMensagens((current) => [...current, novaMsgFormatada]);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    async function loadData() {
        try {
            const meRes = await api.get('/Auth/me');
            const dadosUser = meRes.data;
            setMeuId(dadosUser.meusDados.usuarioId || dadosUser.id);
            setSouLaboratorio(dadosUser.tipo === 'Laboratorio');

            const workResponse = await api.get(`/Trabalhos/${id}`);
            const workData = workResponse.data;
            setTrabalho(workData);

            if (workData.laboratorio && workData.laboratorio.corPrimaria) {
                setBrandColor(workData.laboratorio.corPrimaria);
            } else if (dadosUser.tipo === 'Laboratorio') {
                setBrandColor(localStorage.getItem('elolab_user_color') || '#2563EB');
            }

            try {
                const filesResponse = await api.get(`/Trabalhos/${id}/anexos`);
                setAnexos(filesResponse.data);
                const first3D = filesResponse.data.find((a: Anexo) => a.nomeArquivo.toLowerCase().endsWith('.stl') || a.nomeArquivo.toLowerCase().endsWith('.obj'));
                if (first3D) setStlParaVisualizar(getFullUrl(first3D.url));
                else if (workData.arquivoUrl?.match(/\.(stl|obj)$/i)) setStlParaVisualizar(getFullUrl(workData.arquivoUrl));
            } catch (e) { console.log("Sem anexos"); }

            await loadMensagens(true);
        } catch (error: any) {
            console.error(error);
            setErroCarregamento("Não foi possível carregar os detalhes.");
        } finally {
            setLoading(false);
        }
    }

    async function loadMensagens(showError = false) {
        if(!id) return;
        try {
            const msgResponse = await api.get(`/Mensagens/trabalho/${id}`);
            setMensagens(msgResponse.data);
        } catch (err) { if(showError) console.error("Erro mensagens"); }
    }

    // === FUNÇÃO DE ALTERAR E REVERTER STATUS ===
    async function changeStatus(novoStatus: string) {
        if (!trabalho) return;
        setUpdating(true);
        try {
            await api.patch(`/Trabalhos/${trabalho.id}/status`, JSON.stringify(novoStatus), { headers: { 'Content-Type': 'application/json' } });
            setTrabalho({ ...trabalho, status: novoStatus as any });

            // Notificações amigáveis dependendo da direção
            if (novoStatus === 'Pendente') notify.success("Trabalho revertido para Pendente.");
            else if (novoStatus === 'EmProducao') notify.success("Trabalho movido para Produção.");
            else notify.success(`Trabalho Concluído!`);

        } catch (error) {
            // interceptor cuida
        }
        finally { setUpdating(false); }
    }

    function getFileIcon(nome: string) {
        const ext = nome.split('.').pop()?.toLowerCase();
        if (['stl', 'obj', 'ply'].includes(ext || '')) return <FileBox className="h-5 w-5" style={{ color: brandColor }} />;
        if (['jpg', 'png', 'jpeg'].includes(ext || '')) return <ImageIcon className="h-5 w-5 text-purple-600" />;
        return <File className="h-5 w-5 text-slate-400" />;
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files?.length || !trabalho) return;
        const file = event.target.files[0];
        setUploading(true);
        const formData = new FormData();
        formData.append('trabalhoId', trabalho.id);
        formData.append('arquivo', file);
        try {
            // Agora usa a rota do TrabalhosController
            await api.post(`/Trabalhos/${trabalho.id}/anexo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Busca a lista atualizada
            const filesResponse = await api.get(`/Trabalhos/${trabalho.id}/anexos`);
            setAnexos(filesResponse.data);
            notify.success("Arquivo enviado com sucesso!");

            if(file.name.match(/\.(stl|obj)$/i)) {
                const novoAnexo = filesResponse.data.find((a: Anexo) => a.nomeArquivo === file.name);
                if (novoAnexo) setStlParaVisualizar(getFullUrl(novoAnexo.url));
            }
        } catch (error) {
            // interceptor
        }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if(!novoTexto.trim() || !trabalho) return;
        setSendingMsg(true);
        try {
            await api.post('/Mensagens', { trabalhoId: trabalho.id, texto: novoTexto });
            setNovoTexto('');
        } catch(error) { console.error(error); }
        finally { setSendingMsg(false); }
    }

    async function confirmarExclusaoAnexo() {
        if(!anexoParaExcluir) return;
        try {
            await api.delete(`/Trabalhos/anexo/${anexoParaExcluir}`);
            setAnexos(anexos.filter(a => a.id !== anexoParaExcluir));
            notify.success("Anexo removido.");

            const anexoDeletado = anexos.find(a => a.id === anexoParaExcluir);
            if(anexoDeletado && stlParaVisualizar && getFullUrl(anexoDeletado.url) === stlParaVisualizar) {
                setStlParaVisualizar(null);
            }
        } catch (error) {
            // interceptor
        } finally {
            setAnexoParaExcluir(null);
        }
    }

    function handleBack() {
        if (souLaboratorio) navigate('/dashboard');
        else if (trabalho?.laboratorioId) navigate(`/portal/${trabalho.laboratorioId}`);
        else navigate('/parceiros');
    }

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
    if (!trabalho || erroCarregamento) return <div className="flex h-screen flex-col items-center justify-center gap-4 text-slate-500"><AlertCircle className="h-10 w-10 text-red-400" /><p>{erroCarregamento}</p><button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">Voltar</button></div>;

    // Normalização de status
    const statusReal = (trabalho.status || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const isPendente = statusReal === 'pendente' || statusReal === 'recebido';
    const isProducao = statusReal === 'emproducao' || statusReal === 'em producao';
    const isConcluido = statusReal === 'concluido' || statusReal === 'finalizado';

    return (
        <PageContainer primaryColor={brandColor}>

            {/* === MODAL DE CONFIRMAÇÃO DE EXCLUSÃO === */}
            {anexoParaExcluir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Arquivo?</h3>
                        <p className="text-sm text-slate-500 mb-6">Este arquivo será removido permanentemente deste trabalho.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setAnexoParaExcluir(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 hover:bg-slate-200 transition">Cancelar</button>
                            <button onClick={confirmarExclusaoAnexo} className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 transition">Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-7xl">
                <button
                    onClick={handleBack}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {souLaboratorio ? 'Voltar ao Dashboard' : 'Voltar ao Painel do Parceiro'}
                </button>

                {/* === HEADER DO TRABALHO === */}
                <div className="mb-8 flex flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-slate-900">{trabalho.pacienteNome}</h1>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-mono font-medium text-slate-500">#{trabalho.id.substring(0, 8)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-slate-500">
                            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" style={{ color: brandColor }}/> {trabalho.clinica?.nome || 'Clínica Parceira'}</span>
                            <span className="hidden md:inline text-slate-300">|</span>
                            <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> {trabalho.laboratorio?.nome || 'Meu Lab'}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 flex-wrap items-center">
                        <button onClick={() => window.open(`/print/job/${trabalho.id}`, '_blank')} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition"><Printer className="h-5 w-5" /></button>

                        {!souLaboratorio && (
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-6 py-3 text-sm font-bold text-slate-600 border border-slate-200">
                                Status: {trabalho.status}
                            </div>
                        )}

                        {/* === BOTÕES INTELIGENTES (Avançar e Reverter) === */}
                        {souLaboratorio && isPendente && (
                            <button onClick={() => changeStatus('EmProducao')} disabled={updating} className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50" style={{ backgroundColor: brandColor, boxShadow: `0 4px 14px ${brandColor}40` }}>
                                {updating ? <Loader2 className="animate-spin h-5 w-5"/> : <Play className="h-5 w-5" />} Iniciar Produção
                            </button>
                        )}

                        {souLaboratorio && isProducao && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeStatus('Pendente')} disabled={updating} className="flex items-center justify-center p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition" title="Reverter para Pendente">
                                    <Undo2 className="h-5 w-5" />
                                </button>
                                <button onClick={() => changeStatus('Concluido')} disabled={updating} className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 shadow-lg shadow-green-200 transition disabled:opacity-50">
                                    {updating ? <Loader2 className="animate-spin h-5 w-5"/> : <CheckCircle className="h-5 w-5" />} Concluir Trabalho
                                </button>
                            </div>
                        )}

                        {souLaboratorio && isConcluido && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeStatus('EmProducao')} disabled={updating} className="flex items-center justify-center p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition" title="Reabrir Produção">
                                    <Undo2 className="h-5 w-5" />
                                </button>
                                <button disabled className="flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-500 cursor-default border border-slate-200">
                                    <Package className="h-5 w-5" /> Pronto para Entrega
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {stlParaVisualizar && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
                                <div className="p-2 bg-slate-900 text-white flex justify-between items-center px-4">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"><FileBox className="h-4 w-4" /> Visualização 3D</span>
                                    <button onClick={() => setStlParaVisualizar(null)} className="text-xs hover:text-red-400">Fechar</button>
                                </div>
                                <StlViewer url={stlParaVisualizar} />
                            </div>
                        )}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400"><FileText className="h-4 w-4" /> Ficha Técnica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div><label className="text-xs font-semibold text-slate-400 uppercase">Serviço</label><p className="mt-1 text-lg font-medium text-slate-900">{trabalho.servico?.nome || 'Personalizado'}</p></div>
                                    <div className="flex gap-8">
                                        <div><label className="text-xs font-semibold text-slate-400 uppercase">Dentes</label><p className="mt-1 text-xl font-bold text-slate-900">{trabalho.dentes || '-'}</p></div>
                                        <div><label className="text-xs font-semibold text-slate-400 uppercase">Cor</label><div className="mt-1 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200">{trabalho.corDente || '?'}</span></div></div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-5 border border-slate-100"><label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><AlertCircle className="h-3 w-3" /> Observações</label><p className="text-sm leading-relaxed text-slate-600">{trabalho.descricaoPersonalizada || 'Nenhuma observação.'}</p></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400"><Paperclip className="h-4 w-4" /> Arquivos</h3>
                                <div className="flex gap-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.stl,.obj" />
                                    <button disabled={uploading} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition disabled:opacity-50" style={{ color: brandColor, backgroundColor: `${brandColor}10` }}>{uploading ? <Loader2 className="h-3 w-3 animate-spin"/> : <UploadCloud className="h-3 w-3" />} Upload</button>
                                </div>
                            </div>
                            {anexos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 py-10"><UploadCloud className="h-10 w-10 text-slate-300 mb-2" /><p className="text-sm font-medium text-slate-400">Nenhum arquivo</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {anexos.map(anexo => {
                                        const is3D = anexo.nomeArquivo.match(/\.(stl|obj)$/i);
                                        return (
                                            <div key={anexo.id} className="group relative flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:bg-white hover:shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="rounded-lg bg-white p-2 text-slate-400 shadow-sm border border-slate-100">{getFileIcon(anexo.nomeArquivo)}</div>
                                                    <div className="flex flex-col overflow-hidden"><span className="truncate text-sm font-bold text-slate-700">{anexo.nomeArquivo}</span><span className="text-[10px] text-slate-400">{new Date(anexo.createdAt).toLocaleDateString()}</span></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {is3D && <button onClick={() => setStlParaVisualizar(getFullUrl(anexo.url))} className="rounded-lg bg-white p-2 text-slate-500 shadow-sm border border-slate-100 transition hover:text-blue-600"><Eye className="h-4 w-4" /></button>}
                                                    <a href={getFullUrl(anexo.url)} download target="_blank" rel="noreferrer" className="rounded-lg bg-white p-2 text-slate-500 shadow-sm border border-slate-100 hover:text-green-600"><Download className="h-4 w-4" /></a>
                                                    <button onClick={() => setAnexoParaExcluir(anexo.id)} className="rounded-lg bg-white p-2 text-slate-300 shadow-sm border border-slate-100 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Planeamento</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 rounded-xl border border-orange-100 bg-orange-50 p-4">
                                    <div className="rounded-full bg-white p-2 text-orange-500 shadow-sm"><Calendar className="h-5 w-5" /></div>
                                    <div><p className="text-xs font-bold uppercase text-orange-800 opacity-70">Entrega</p><p className="font-bold text-slate-900">{new Date(trabalho.dataEntregaPrevista).toLocaleDateString('pt-BR')}</p></div>
                                </div>
                                <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                    <div className="rounded-full bg-white p-2 text-emerald-500 shadow-sm"><Euro className="h-5 w-5" /></div>
                                    <div><p className="text-xs font-bold uppercase text-emerald-800 opacity-70">Total</p><p className="font-bold text-slate-900">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(trabalho.valorFinal)}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex h-[500px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/80 p-4 backdrop-blur-sm"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><MessageSquare className="h-4 w-4" style={{ color: brandColor }} /> Chat</h3></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                {mensagens.length === 0 && <div className="flex flex-col items-center justify-center h-full text-slate-400"><MessageSquare className="h-8 w-8 mb-2 opacity-20" /><p className="text-xs">Sem mensagens.</p></div>}
                                {mensagens.map(msg => {
                                    const isMe = msg.remetenteId === meuId;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe ? 'text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`} style={isMe ? { backgroundColor: brandColor } : {}}><p>{msg.texto}</p></div>
                                            <span className="mt-1 px-1 text-[10px] font-medium text-slate-400">{isMe ? 'Você' : msg.nomeRemetente} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3 bg-white">
                                <div className="flex items-center gap-2">
                                    <input type="text" value={novoTexto} onChange={e => setNovoTexto(e.target.value)} placeholder="Digite..." className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white" onFocus={(e) => e.target.style.borderColor = brandColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    <button type="submit" disabled={sendingMsg || !novoTexto.trim()} className="flex h-10 w-10 items-center justify-center rounded-full text-white disabled:opacity-50 transition shadow-sm hover:shadow-md" style={{ backgroundColor: brandColor }}>{sendingMsg ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 ml-0.5" />}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}