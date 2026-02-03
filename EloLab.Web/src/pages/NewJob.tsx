import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Calendar, User, FileText,
    Building2, Palette, ChevronDown, Euro, UploadCloud,
    FileBox, Image as ImageIcon, Trash2, File
} from 'lucide-react';
import type { UserSession, Servico } from '../types';

export function NewJob() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserSession | null>(null);
    const [listaServicos, setListaServicos] = useState<Servico[]>([]);
    const [listaParceiros, setListaParceiros] = useState<any[]>([]);
    const [paciente, setPaciente] = useState('');
    const [dentes, setDentes] = useState('');
    const [cor, setCor] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [obs, setObs] = useState('');
    const [arquivos, setArquivos] = useState<File[]>([]);
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
            navigate('/dashboard');
        }
    }

    function handleServicoChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const novoId = e.target.value;
        setServicoId(novoId);
        const servicoSelecionado = listaServicos.find(s => s.id === novoId);
        if (servicoSelecionado) setValor(servicoSelecionado.precoBase.toString());
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            const novosArquivos = Array.from(e.target.files);
            setArquivos(prev => [...prev, ...novosArquivos]);
        }
    }

    function removeFile(index: number) {
        setArquivos(prev => prev.filter((_, i) => i !== index));
    }

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

            if (arquivos.length > 0 && trabalhoId) {
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
            alert('Erro ao criar trabalho.');
        } finally {
            setLoading(false);
        }
    }

    const isLab = user?.tipo === 'Laboratorio';
    const handleBack = () => { isLab ? navigate('/dashboard') : navigate('/parceiros'); };

    return (
        <div className="p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <button onClick={handleBack} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-800 transition">
                        <ArrowLeft className="h-4 w-4" /> Cancelar e Voltar
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 border-b border-slate-100 pb-6">
                        <h1 className="text-3xl font-bold text-slate-900">Novo Pedido</h1>
                        <p className="text-slate-500 mt-1">Preencha os dados abaixo para iniciar um novo trabalho.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Nome do Paciente</label>
                                <div className="relative">
                                    <User className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                    <input required type="text" value={paciente} onChange={e => setPaciente(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 font-medium outline-none focus:border-blue-500 focus:bg-white transition"
                                           placeholder="Ex: Maria Silva" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-blue-800">{isLab ? "Clínica (Cliente)" : "Laboratório (Parceiro)"}</label>
                                <div className="relative">
                                    <Building2 className="absolute top-3 left-3 h-5 w-5 text-blue-500" />
                                    <select required value={parceiroSelecionadoId} onChange={e => setParceiroSelecionadoId(e.target.value)}
                                            className="w-full appearance-none rounded-xl border border-blue-200 bg-blue-50 py-3 pl-10 pr-8 text-sm font-bold text-blue-900 outline-none focus:border-blue-500 transition cursor-pointer">
                                        <option value="">{isLab ? "Selecione a Clínica..." : "Selecione o Laboratório..."}</option>
                                        {listaParceiros.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                            <h3 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                <FileText className="h-4 w-4"/> Ficha Técnica
                            </h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Serviço</label>
                                    <div className="relative">
                                        <select value={servicoId} onChange={handleServicoChange} disabled={!parceiroSelecionadoId && !isLab}
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-8 text-sm font-medium outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 transition cursor-pointer">
                                            <option value="">Selecione o serviço...</option>
                                            {listaServicos.map(s => <option key={s.id} value={s.id}>{s.nome} - {s.material} ({new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.precoBase)})</option>)}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Dentes</label>
                                    <input type="text" value={dentes} onChange={e => setDentes(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 font-medium outline-none focus:border-blue-500 transition" placeholder="Ex: 11, 21" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Cor</label>
                                    <div className="relative">
                                        <Palette className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input type="text" value={cor} onChange={e => setCor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-medium outline-none focus:border-blue-500 transition" placeholder="Ex: A2" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Data de Entrega</label>
                                    <div className="relative">
                                        <Calendar className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input required type="datetime-local" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-medium outline-none focus:border-blue-500 transition" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Valor Estimado (€)</label>
                                    <div className="relative">
                                        <Euro className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input type="number" value={valor} onChange={e => setValor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-medium outline-none focus:border-blue-500 transition" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Anexos (STL, OBJ, Fotos, PDF)</label>
                            <div className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-500 hover:bg-blue-50">
                                <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-600 transition">
                                    <UploadCloud className="mb-2 h-10 w-10" />
                                    <span className="text-sm font-bold">Clique ou arraste arquivos aqui</span>
                                    <span className="text-xs mt-1 opacity-70">Suporta múltiplos arquivos</span>
                                </div>
                                <input type="file" multiple accept=".stl,.obj,.ply,.jpg,.jpeg,.png,.pdf" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={handleFileSelect} />
                            </div>
                            {arquivos.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {arquivos.map((arq, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">{getFileIcon(arq.name)}</div>
                                                <div className="truncate">
                                                    <p className="truncate text-sm font-bold text-slate-700">{arq.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{(arq.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeFile(index)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Observações Adicionais</label>
                            <textarea rows={3} value={obs} onChange={e => setObs(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm font-medium outline-none focus:border-blue-500 transition" placeholder="Instruções específicas para este caso..." />
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg transition hover:bg-slate-800 hover:-translate-y-0.5 disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Confirmar Pedido</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}