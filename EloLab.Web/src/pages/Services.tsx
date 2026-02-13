import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    Plus, Trash2, Clock, Loader2, Save, X, Edit, Search, Image as ImageIcon, Settings, Package
} from 'lucide-react';
import type { Servico } from '../types';

// Interface para o Material
interface Material {
    id: string;
    nome: string;
}

export function Services() {
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanPath}`;
    };

    // Dados Principais
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filtros e Busca
    const [filtroMaterial, setFiltroMaterial] = useState('Todos');
    const [busca, setBusca] = useState('');

    // Formulário de Serviço
    const [idEdicao, setIdEdicao] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [materialNome, setMaterialNome] = useState('');
    const [preco, setPreco] = useState('');
    const [prazo, setPrazo] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');

    // Modals
    const [servicoParaExcluir, setServicoParaExcluir] = useState<string | null>(null);
    const [showMateriaisModal, setShowMateriaisModal] = useState(false);
    const [novoMaterialNome, setNovoMaterialNome] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [resServicos, resMateriais] = await Promise.all([
                api.get('/Servicos'),
                api.get('/Materiais')
            ]);
            setServicos(resServicos.data);
            setMateriais(resMateriais.data);

            // Define o primeiro material como padrão se existir
            if (resMateriais.data.length > 0) {
                setMaterialNome(resMateriais.data[0].nome);
            }
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.size > 2 * 1024 * 1024) { notify.error("A imagem deve ter no máximo 2MB."); return; }

        const formData = new FormData();
        formData.append('arquivo', file);

        try {
            const res = await api.post('/Laboratorios/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setFotoUrl(res.data.url);
        } catch (error) { }
    }

    // === GESTÃO DE SERVIÇOS ===
    function handleEditClick(s: Servico) {
        setIdEdicao(s.id);
        setNome(s.nome);
        setMaterialNome(s.material || '');
        setPreco(s.precoBase.toString());
        setPrazo(s.prazoDiasUteis ? s.prazoDiasUteis.toString() : '5');
        setFotoUrl(s.fotoUrl || '');
    }

    function handleCancelEdit() {
        setIdEdicao(null);
        setNome('');
        setMaterialNome(materiais.length > 0 ? materiais[0].nome : '');
        setPreco('');
        setPrazo('');
        setFotoUrl('');
    }

    async function handleSaveService(e: React.FormEvent) {
        e.preventDefault();

        if (materiais.length === 0) {
            notify.error("Crie pelo menos um material antes de adicionar serviços.");
            setShowMateriaisModal(true);
            return;
        }

        setSaving(true);
        const payload = {
            nome,
            material: materialNome,
            precoBase: parseFloat(preco),
            prazoDiasUteis: parseInt(prazo),
            descricao: "",
            fotoUrl: fotoUrl
        };
        try {
            if (idEdicao) {
                await api.put(`/Servicos/${idEdicao}`, payload);
                notify.success("Serviço atualizado!");
            } else {
                await api.post('/Servicos', payload);
                notify.success("Serviço criado!");
            }
            handleCancelEdit();
            const res = await api.get('/Servicos');
            setServicos(res.data);
        } catch (error) { } finally { setSaving(false); }
    }

    async function confirmarExclusao() {
        if (!servicoParaExcluir) return;
        try {
            await api.delete(`/Servicos/${servicoParaExcluir}`);
            setServicos(servicos.filter(s => s.id !== servicoParaExcluir));
            notify.success("Serviço excluído.");
        } catch (error) { } finally { setServicoParaExcluir(null); }
    }

    // === GESTÃO DE MATERIAIS (NOVO) ===
    async function handleAddMaterial(e: React.FormEvent) {
        e.preventDefault();
        if (!novoMaterialNome.trim()) return;
        try {
            const res = await api.post('/Materiais', { nome: novoMaterialNome });
            const listaAtualizada = [...materiais, res.data];
            setMateriais(listaAtualizada);
            setNovoMaterialNome('');

            if (listaAtualizada.length === 1) setMaterialNome(res.data.nome);

            notify.success("Material criado!");
        } catch (error) { notify.error("Erro ao criar material."); }
    }

    async function handleDeleteMaterial(id: string) {
        try {
            await api.delete(`/Materiais/${id}`);
            const novaLista = materiais.filter(m => m.id !== id);
            setMateriais(novaLista);
            if (novaLista.length > 0 && materialNome === '') setMaterialNome(novaLista[0].nome);
            notify.success("Material removido.");
        } catch (error) { notify.error("Erro ao remover material."); }
    }

    const servicosFiltrados = servicos.filter(s => {
        const matchesMaterial = filtroMaterial === 'Todos' || s.material === filtroMaterial;
        const matchesBusca = s.nome.toLowerCase().includes(busca.toLowerCase());
        return matchesMaterial && matchesBusca;
    });

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

    return (
        <PageContainer primaryColor={primaryColor}>

            {/* MODAL GESTÃO DE MATERIAIS */}
            {showMateriaisModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Package className="h-5 w-5 text-slate-500" /> Gerir Materiais</h3>
                            <button onClick={() => setShowMateriaisModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1">
                            <form onSubmit={handleAddMaterial} className="flex gap-2 mb-6">
                                <input
                                    autoFocus
                                    type="text"
                                    value={novoMaterialNome}
                                    onChange={e => setNovoMaterialNome(e.target.value)}
                                    placeholder="Novo material (Ex: Zircónia)"
                                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                                />
                                <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition">Adicionar</button>
                            </form>

                            {materiais.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Nenhum material cadastrado.<br/>Adicione materiais para criar serviços.
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {materiais.map(m => (
                                        <li key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-bold text-slate-700">{m.nome}</span>
                                            <button onClick={() => handleDeleteMaterial(m.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                            <button onClick={() => setShowMateriaisModal(false)} className="text-sm font-bold text-slate-500 hover:text-slate-800 px-4 py-2">Concluir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EXCLUSÃO SERVIÇO */}
            {servicoParaExcluir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4"><Trash2 className="h-6 w-6 text-red-600" /></div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Serviço?</h3>
                        <p className="text-sm text-slate-500 mb-6">Este serviço será removido do catálogo.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setServicoParaExcluir(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600">Cancelar</button>
                            <button onClick={confirmarExclusao} className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg">Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Serviços & Preços</h1>
                <p className="text-slate-500">Crie os seus materiais e monte o seu catálogo.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className="lg:col-span-1">
                    <div className={`sticky top-6 rounded-2xl border p-6 shadow-sm transition-colors bg-white border-slate-200`}
                         style={idEdicao ? { borderColor: primaryColor, backgroundColor: `${primaryColor}05` } : {}}>

                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900" style={idEdicao ? { color: primaryColor } : {}}>
                                {idEdicao ? 'Editar Serviço' : 'Novo Serviço'}
                            </h2>
                            {idEdicao && (
                                <button onClick={handleCancelEdit} type="button" className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-600"><X className="h-5 w-5" /></button>
                            )}
                        </div>

                        <form onSubmit={handleSaveService} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Foto do Serviço</label>
                                <div className="relative flex h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition" onClick={() => fileInputRef.current?.click()}>
                                    {fotoUrl ? <img src={getFullUrl(fotoUrl)} className="h-full w-full object-cover" alt="Preview" /> : <div className="flex flex-col items-center text-slate-400"><ImageIcon className="mb-2 h-8 w-8 opacity-50" /><span className="text-xs font-bold">Clique para enviar</span></div>}
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png, image/jpeg, image/webp" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Nome</label>
                                <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-opacity-50" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} placeholder="Ex: Coroa Total" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Material</label>
                                    <button type="button" onClick={() => setShowMateriaisModal(true)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                        <Settings className="h-3 w-3" /> Gerir Lista
                                    </button>
                                </div>
                                {materiais.length === 0 ? (
                                    <div onClick={() => setShowMateriaisModal(true)} className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-400 text-center cursor-pointer hover:bg-slate-100 hover:text-slate-600 transition">
                                        + Criar Materiais Primeiro
                                    </div>
                                ) : (
                                    <select value={materialNome} onChange={e => setMaterialNome(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}>
                                        {materiais.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Preço (€)</label>
                                    <input required type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Prazo (Dias)</label>
                                    <input required type="number" value={prazo} onChange={e => setPrazo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} placeholder="5" />
                                </div>
                            </div>
                            <button disabled={saving} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition shadow-lg hover:-translate-y-0.5 disabled:opacity-50" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : idEdicao ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {idEdicao ? 'Salvar Alterações' : 'Adicionar Serviço'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLUNA DIREITA: LISTA */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute top-3 left-4 h-5 w-5 text-slate-400" />
                            <input type="text" placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                            <button onClick={() => setFiltroMaterial('Todos')} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition border`} style={filtroMaterial === 'Todos' ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>Todos</button>
                            {materiais.map(m => (
                                <button key={m.id} onClick={() => setFiltroMaterial(m.nome)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition border`} style={filtroMaterial === m.nome ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>{m.nome}</button>
                            ))}
                            <button onClick={() => setShowMateriaisModal(true)} className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition border border-transparent flex items-center gap-1">
                                <Settings className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Catálogo</h2>
                            <span className="text-xs font-bold text-slate-400">{servicosFiltrados.length} serviços</span>
                        </div>
                        {servicosFiltrados.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">Nenhum serviço encontrado.</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {servicosFiltrados.map((s) => (
                                    <div key={s.id} className="group flex items-center justify-between p-5 hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                                {s.fotoUrl ? (
                                                    <img src={getFullUrl(s.fotoUrl)} className="h-full w-full object-cover" alt={s.nome} />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center font-bold text-xs text-slate-400" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                                                        {s.material ? s.material.substring(0, 2).toUpperCase() : 'GE'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-base">{s.nome}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{s.material || 'Geral'}</span>
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.prazoDiasUteis} dias úteis</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-black text-slate-900 text-base">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.precoBase)}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(s)} className="rounded-lg p-2 transition hover:bg-slate-100" style={{ color: primaryColor }}><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => setServicoParaExcluir(s.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}