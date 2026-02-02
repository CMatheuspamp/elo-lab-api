import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Calendar, User, FileText,
    Building2, Palette, ChevronDown, Euro, UploadCloud,
    FileBox, Image as ImageIcon, Trash2, File // Novos ícones
} from 'lucide-react';
import type { UserSession, Servico } from '../types';

export function NewJob() {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserSession | null>(null);

    // Listas de Dados
    const [listaServicos, setListaServicos] = useState<Servico[]>([]);
    const [listaParceiros, setListaParceiros] = useState<any[]>([]);

    // Estados do Formulário
    const [paciente, setPaciente] = useState('');
    const [dentes, setDentes] = useState('');
    const [cor, setCor] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [obs, setObs] = useState('');

    // MUDANÇA: Agora é um array de arquivos
    const [arquivos, setArquivos] = useState<File[]>([]);

    // Seleções
    const [parceiroSelecionadoId, setParceiroSelecionadoId] = useState('');
    const [servicoId, setServicoId] = useState('');
    const [valor, setValor] = useState('');

    useEffect(() => {
        carregarDadosIniciais();
    }, []);

    useEffect(() => {
        if (!user) return;
        if (user.tipo === 'Clinica' && parceiroSelecionadoId) {
            setListaServicos([]);
            setServicoId('');
            setValor('');
            api.get(`/Servicos/laboratorio/${parceiroSelecionadoId}`)
                .then(res => setListaServicos(res.data))
                .catch(() => alert("Erro ao carregar tabela de preços deste parceiro."));
        }
    }, [parceiroSelecionadoId, user]);

    async function carregarDadosIniciais() {
        try {
            const resUser = await api.get('/Auth/me');
            const usuarioLogado = resUser.data;
            setUser(usuarioLogado);

            if (usuarioLogado.tipo === 'Laboratorio') {
                api.get('/Servicos').then(res => setListaServicos(res.data));
                const res = await api.get('/Clinicas');
                setListaParceiros(res.data);
            } else {
                const res = await api.get('/Laboratorios');
                setListaParceiros(res.data);
                const preSelectedLabId = location.state?.labId;
                if (preSelectedLabId) setParceiroSelecionadoId(preSelectedLabId);
            }
        } catch (error) {
            console.error("Erro ao carregar dados", error);
            navigate('/dashboard');
        }
    }

    function handleServicoChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const novoId = e.target.value;
        setServicoId(novoId);
        const servicoSelecionado = listaServicos.find(s => s.id === novoId);
        if (servicoSelecionado) setValor(servicoSelecionado.precoBase.toString());
    }

    // Função para adicionar arquivos à lista
    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            const novosArquivos = Array.from(e.target.files);
            setArquivos(prev => [...prev, ...novosArquivos]);
        }
    }

    // Função para remover arquivo da lista
    function removeFile(index: number) {
        setArquivos(prev => prev.filter((_, i) => i !== index));
    }

    // Função auxiliar para ícone do arquivo
    function getFileIcon(fileName: string) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <ImageIcon className="h-5 w-5 text-purple-500" />;
        if (['stl', 'obj', 'ply'].includes(ext || '')) return <FileBox className="h-5 w-5 text-blue-500" />;
        return <File className="h-5 w-5 text-slate-400" />;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // 1. Criar o Pedido
            const payload = {
                laboratorioId: user.tipo === 'Laboratorio' ? user.meusDados.id : parceiroSelecionadoId,
                clinicaId: user.tipo === 'Laboratorio' ? parceiroSelecionadoId : user.meusDados.id,
                servicoId: servicoId || null,
                pacienteNome: paciente,
                dentes: dentes,
                corDente: cor,
                dataEntrega: new Date(dataEntrega).toISOString(),
                valorPersonalizado: valor ? parseFloat(valor) : null,
                descricaoPersonalizada: obs
            };

            const response = await api.post('/Trabalhos', payload);
            const trabalhoId = response.data.id;

            // 2. Upload de Múltiplos Arquivos (Loop)
            if (arquivos.length > 0 && trabalhoId) {
                // Upload um por um para garantir
                for (const arquivo of arquivos) {
                    const formData = new FormData();
                    formData.append('arquivo', arquivo);

                    await api.post(`/Trabalhos/${trabalhoId}/anexo`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            }

            alert('✅ Pedido criado com sucesso!');
            if (user.tipo === 'Clinica') navigate('/parceiros');
            else navigate('/dashboard');

        } catch (error) {
            console.error(error);
            alert('Erro ao criar trabalho.');
        } finally {
            setLoading(false);
        }
    }

    const isLab = user?.tipo === 'Laboratorio';
    const handleBack = () => { isLab ? navigate('/dashboard') : navigate('/parceiros'); };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            <div className="mx-auto max-w-3xl">

                <button onClick={handleBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> {isLab ? 'Voltar ao Dashboard' : 'Voltar aos Parceiros'}
                </button>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 border-b border-slate-100 pb-4">
                        <h1 className="text-2xl font-bold text-slate-900">Novo Pedido</h1>
                        <p className="text-slate-500">Preencha os dados e anexe os arquivos do caso.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Seção 1: Identificação */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do Paciente</label>
                                <div className="relative">
                                    <User className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                    <input required type="text" value={paciente} onChange={e => setPaciente(e.target.value)}
                                           className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                           placeholder="Ex: Maria Silva" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-blue-800">{isLab ? "Clínica (Cliente)" : "Laboratório (Parceiro)"}</label>
                                <div className="relative">
                                    <Building2 className="absolute top-2.5 left-3 h-5 w-5 text-blue-500" />
                                    <select required value={parceiroSelecionadoId} onChange={e => setParceiroSelecionadoId(e.target.value)}
                                            className="w-full appearance-none rounded-lg border border-blue-200 bg-blue-50 py-2.5 pl-10 pr-8 text-sm font-medium text-blue-900 outline-none focus:border-blue-500">
                                        <option value="">{isLab ? "Selecione a Clínica..." : "Selecione o Laboratório..."}</option>
                                        {listaParceiros.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Especificações */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                                <FileText className="h-4 w-4"/> Especificações
                            </h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Serviço</label>
                                    <div className="relative">
                                        <select value={servicoId} onChange={handleServicoChange} disabled={!parceiroSelecionadoId && !isLab}
                                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400">
                                            <option value="">Selecione...</option>
                                            {listaServicos.map(s => <option key={s.id} value={s.id}>{s.nome} - {s.material} ({new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.precoBase)})</option>)}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Dentes</label><input type="text" value={dentes} onChange={e => setDentes(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 px-4 outline-none focus:border-blue-500" placeholder="Ex: 11, 21" /></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Cor</label><div className="relative"><Palette className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" /><input type="text" value={cor} onChange={e => setCor(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500" placeholder="Ex: A2" /></div></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Entrega</label><div className="relative"><Calendar className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" /><input required type="datetime-local" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500" /></div></div>
                                <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Valor (€)</label><div className="relative"><Euro className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" /><input type="number" value={valor} onChange={e => setValor(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500" /></div></div>
                            </div>
                        </div>

                        {/* === ÁREA DE ANEXOS (MÚLTIPLOS) === */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Anexos (Fotos, STL, OBJ, PDF)</label>

                            {/* Dropzone */}
                            <div className="group relative flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-500 hover:bg-blue-50">
                                <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500">
                                    <UploadCloud className="mb-1 h-8 w-8" />
                                    <span className="text-xs font-semibold">Clique para adicionar arquivos</span>
                                </div>
                                <input
                                    type="file"
                                    multiple // <--- Permite múltiplos
                                    accept=".stl,.obj,.ply,.jpg,.jpeg,.png,.pdf"
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* Lista de Arquivos Selecionados */}
                            {arquivos.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {arquivos.map((arq, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded bg-slate-100 p-1.5">
                                                    {getFileIcon(arq.name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{arq.name}</p>
                                                    <p className="text-xs text-slate-400">{(arq.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Obs */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Observações</label>
                            <textarea rows={3} value={obs} onChange={e => setObs(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 px-4 outline-none focus:border-blue-500" />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Criar Pedido</>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}