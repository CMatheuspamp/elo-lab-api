import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    ScrollText, Plus, ArrowLeft, Edit2, DollarSign,
    Loader2, X, Trash2, AlertTriangle, Copy, Search, CheckCheck, Settings
} from 'lucide-react';

export function PriceTables() {
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    // Estados de Controle
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [actionLoading, setActionLoading] = useState(false);

    // Dados
    const [tabelas, setTabelas] = useState<any[]>([]);
    const [tabelaSelecionada, setTabelaSelecionada] = useState<any>(null);
    const [servicosMestre, setServicosMestre] = useState<any[]>([]);
    const [tabelaItens, setTabelaItens] = useState<any[]>([]);

    // Modals
    const [showModalTabela, setShowModalTabela] = useState(false);
    const [showModalItem, setShowModalItem] = useState(false);
    const [showAddTodosModal, setShowAddTodosModal] = useState(false);

    // Modal Delete
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean; type: 'tabela' | 'item' | null; targetId: string; nome?: string;
    }>({ isOpen: false, type: null, targetId: '' });

    // Form Tabela
    const [nomeTabela, setNomeTabela] = useState('');
    const [editandoTabelaId, setEditandoTabelaId] = useState<string | null>(null);

    // Form Item
    const [selectedServicoId, setSelectedServicoId] = useState('');
    const [precoItem, setPrecoItem] = useState('');
    const [editandoItem, setEditandoItem] = useState<any>(null);
    const [buscaServico, setBuscaServico] = useState(''); // Para a pesquisa dentro do modal

    // Form Adicionar Todos
    const [descontoGlobal, setDescontoGlobal] = useState('0');

    useEffect(() => {
        loadTabelas();
    }, []);

    // === CARREGAMENTOS ===
    async function loadTabelas() {
        try {
            const res = await api.get('/TabelasPrecos');
            setTabelas(res.data);
        } catch (e) {
            notify.error("Erro ao carregar tabelas.");
        } finally {
            setLoading(false);
        }
    }

    async function openTabelaDetails(tabela: any) {
        setLoading(true);
        try {
            const resDetalhes = await api.get(`/TabelasPrecos/${tabela.id}`);
            setTabelaItens(resDetalhes.data.itens || []);
            setTabelaSelecionada(tabela);

            const resServicos = await api.get('/Servicos');
            setServicosMestre(resServicos.data);

            setViewMode('details');
        } catch (e) {
            notify.error("Erro ao abrir tabela.");
        } finally {
            setLoading(false);
        }
    }

    async function refreshItensTabela() {
        if (!tabelaSelecionada) return;
        const res = await api.get(`/TabelasPrecos/${tabelaSelecionada.id}`);
        setTabelaItens(res.data.itens || []);
    }

    // === AÇÕES DE TABELA (CRIAR/EDITAR/DUPLICAR) ===
    function openModalTabela(tabelaExistente?: any) {
        if (tabelaExistente) {
            setEditandoTabelaId(tabelaExistente.id);
            setNomeTabela(tabelaExistente.nome);
        } else {
            setEditandoTabelaId(null);
            setNomeTabela('');
        }
        setShowModalTabela(true);
    }

    async function handleSalvarTabela(e: React.FormEvent) {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (editandoTabelaId) {
                const res = await api.put(`/TabelasPrecos/${editandoTabelaId}`, { nome: nomeTabela });
                setTabelas(prev => prev.map(t => t.id === editandoTabelaId ? res.data : t));
                if (tabelaSelecionada?.id === editandoTabelaId) setTabelaSelecionada(res.data);
                notify.success("Tabela renomeada!");
            } else {
                const res = await api.post('/TabelasPrecos', { nome: nomeTabela });
                setTabelas([...tabelas, res.data]);
                notify.success("Tabela criada!");
            }
            setShowModalTabela(false);
        } catch (e) {
            notify.error("Erro ao salvar tabela.");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDuplicarTabela(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        try {
            const res = await api.post(`/TabelasPrecos/${id}/duplicar`);
            setTabelas([...tabelas, res.data]);
            notify.success("Tabela duplicada com sucesso!");
        } catch (e) {
            notify.error("Erro ao duplicar tabela.");
        }
    }

    // === AÇÕES DE ITEM (ADICIONAR/EDITAR) ===
    function openModalItem(itemExistente?: any) {
        setBuscaServico(''); // Limpa a busca ao abrir
        if (itemExistente) {
            setEditandoItem(itemExistente);
            setSelectedServicoId(itemExistente.servicoId);
            setPrecoItem(itemExistente.preco);
        } else {
            setEditandoItem(null);
            setSelectedServicoId('');
            setPrecoItem('');
        }
        setShowModalItem(true);
    }

    async function handleSaveItem(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedServicoId || !precoItem) return;

        setActionLoading(true);
        try {
            const payload = { servicoId: selectedServicoId, preco: parseFloat(precoItem) };
            await api.post(`/TabelasPrecos/${tabelaSelecionada.id}/itens`, payload);
            notify.success("Preço salvo com sucesso!");
            await refreshItensTabela();
            setShowModalItem(false);
        } catch (e) {
            notify.error("Erro ao salvar preço.");
        } finally {
            setActionLoading(false);
        }
    }

    // === AÇÃO MÁGICA: ADICIONAR TODOS ===
    async function handleAdicionarTodos(e: React.FormEvent) {
        e.preventDefault();
        setActionLoading(true);
        try {
            const desc = parseFloat(descontoGlobal) || 0;
            const res = await api.post(`/TabelasPrecos/${tabelaSelecionada.id}/adicionar-todos?desconto=${desc}`);
            notify.success(res.data.mensagem || "Serviços importados com sucesso!");
            await refreshItensTabela();
            setShowAddTodosModal(false);
        } catch (e) {
            notify.error("Erro ao importar serviços.");
        } finally {
            setActionLoading(false);
        }
    }

    // === LÓGICA DE DELETE ===
    function confirmDeleteTabela(e: React.MouseEvent, tabela: any) {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, type: 'tabela', targetId: tabela.id, nome: tabela.nome });
    }

    function confirmDeleteItem(item: any) {
        setDeleteModal({ isOpen: true, type: 'item', targetId: item.id, nome: item.servico?.nome });
    }

    async function handleDelete() {
        setActionLoading(true);
        try {
            if (deleteModal.type === 'tabela') {
                await api.delete(`/TabelasPrecos/${deleteModal.targetId}`);
                setTabelas(prev => prev.filter(t => t.id !== deleteModal.targetId));
                notify.success("Tabela removida.");
            } else if (deleteModal.type === 'item') {
                await api.delete(`/TabelasPrecos/${tabelaSelecionada.id}/itens/${deleteModal.targetId}`);
                setTabelaItens(prev => prev.filter(i => i.id !== deleteModal.targetId));
                notify.success("Serviço removido.");
            }
        } catch (error) {
            notify.error("Erro ao remover.");
        } finally {
            setActionLoading(false);
            setDeleteModal({ isOpen: false, type: null, targetId: '' });
        }
    }

    // Filtra os serviços no modal de Adicionar Item baseado no input de texto
    const servicosFiltrados = useMemo(() => {
        if (!buscaServico) return servicosMestre;
        return servicosMestre.filter(s => s.nome.toLowerCase().includes(buscaServico.toLowerCase()));
    }, [buscaServico, servicosMestre]);

    // === RENDERIZAR ===
    if (loading && viewMode === 'list' && tabelas.length === 0)
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

    return (
        <PageContainer primaryColor={primaryColor}>

            {/* === MODAL CONFIRMAÇÃO DELETE === */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
                            <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Apagar {deleteModal.type === 'tabela' ? 'Tabela' : 'Item'}?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Tem a certeza que deseja remover "{deleteModal.nome}"? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal({ isOpen: false, type: null, targetId: '' })} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 hover:bg-slate-200 transition">Cancelar</button>
                            <button onClick={handleDelete} disabled={actionLoading} className="flex-1 rounded-xl py-3 font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition disabled:opacity-50 flex justify-center items-center">
                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Apagar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL CRIAR/EDITAR TABELA === */}
            {showModalTabela && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">{editandoTabelaId ? 'Renomear Tabela' : 'Nova Tabela de Preços'}</h2>
                        <form onSubmit={handleSalvarTabela}>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Nome da Tabela</label>
                            <input autoFocus type="text" value={nomeTabela} onChange={e => setNomeTabela(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 mb-6 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition" placeholder="Ex: Tabela VIP 2024" required />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModalTabela(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">Cancelar</button>
                                <button type="submit" disabled={actionLoading} className="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50 min-w-[100px]">
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODAL IMPORTAÇÃO EM MASSA (ADICIONAR TODOS) === */}
            {showAddTodosModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                            <CheckCheck className="h-7 w-7" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Importar Catálogo</h2>
                        <p className="text-sm text-slate-500 mb-6">Esta ação adicionará todos os serviços ativos do seu laboratório a esta tabela.</p>

                        <form onSubmit={handleAdicionarTodos}>
                            <div className="text-left mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Aplicar Desconto Global (%)</label>
                                <input
                                    type="number"
                                    min="0" max="100" step="1"
                                    value={descontoGlobal}
                                    onChange={e => setDescontoGlobal(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white text-center text-lg font-bold text-slate-700"
                                    placeholder="Ex: 10"
                                />
                                <p className="text-[10px] text-slate-400 mt-2 text-center">Se quiser manter os preços base, deixe 0%.</p>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAddTodosModal(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 hover:bg-slate-200 transition">Cancelar</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 rounded-xl py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50 flex justify-center items-center">
                                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Importar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODAL ADICIONAR/EDITAR ÚNICO ITEM === */}
            {showModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                {editandoItem ? 'Editar Preço' : 'Adicionar Serviço'}
                            </h2>
                            <button onClick={() => setShowModalItem(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition"><X className="h-5 w-5" /></button>
                        </div>

                        <form onSubmit={handleSaveItem} className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">

                            {/* Bloco de Seleção de Serviço (Pesquisável) */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Serviço</label>
                                {!editandoItem ? (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Escreva para procurar um serviço..."
                                                value={buscaServico}
                                                onChange={e => setBuscaServico(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 bg-slate-50 text-sm"
                                            />
                                        </div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-inner">
                                            {servicosFiltrados.length === 0 ? (
                                                <div className="p-3 text-center text-sm text-slate-400">Nenhum serviço encontrado.</div>
                                            ) : (
                                                <div className="divide-y divide-slate-100">
                                                    {servicosFiltrados.map(s => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => { setSelectedServicoId(s.id); setPrecoItem(s.precoBase); }}
                                                            className={`p-3 text-sm cursor-pointer hover:bg-blue-50 transition flex justify-between items-center ${selectedServicoId === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                                                        >
                                                            <span className={`font-medium ${selectedServicoId === s.id ? 'text-blue-700' : 'text-slate-700'}`}>{s.nome}</span>
                                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{s.precoBase}€ Base</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // Se estiver editando, mostra só o nome bloqueado
                                    <div className="w-full border border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-500 cursor-not-allowed">
                                        {editandoItem.servico?.nome}
                                    </div>
                                )}
                            </div>

                            {/* Bloco de Preço */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Preço nesta Tabela (€)</label>
                                <div className="relative">
                                    <DollarSign className="absolute top-3.5 left-4 h-5 w-5 text-emerald-500" />
                                    <input
                                        type="number" step="0.01"
                                        value={precoItem}
                                        onChange={e => setPrecoItem(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-lg font-bold text-slate-900 transition"
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={actionLoading || !selectedServicoId} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 mt-4 transition hover:-translate-y-0.5 disabled:opacity-50 flex justify-center items-center gap-2">
                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Preço'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= CONTEÚDO PRINCIPAL ================= */}

            {viewMode === 'list' ? (
                // === VISÃO 1: LISTA DE TABELAS ===
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tabelas de Preços</h1>
                            <p className="text-slate-500 mt-1">Gira os preços por defeito e crie tabelas exclusivas para clínicas.</p>
                        </div>
                        <button
                            onClick={() => openModalTabela()}
                            className="flex items-center gap-2 px-6 py-3 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Plus className="h-5 w-5" /> Nova Tabela
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tabelas.map(tabela => (
                            <div
                                key={tabela.id}
                                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: primaryColor }}></div>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                                        <ScrollText className="h-6 w-6" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); openModalTabela(tabela); }} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition z-10" title="Renomear Tabela">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={(e) => handleDuplicarTabela(e, tabela.id)} className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition z-10" title="Duplicar Tabela">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        <button onClick={(e) => confirmDeleteTabela(e, tabela)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition z-10" title="Apagar Tabela">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div onClick={() => openTabelaDetails(tabela)} className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{tabela.nome}</h3>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                                            {tabela.itens?.length || 0} Serviços Registados
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Card de Criar (Atalho) */}
                        <button
                            onClick={() => openModalTabela()}
                            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors gap-3 h-full min-h-[180px]"
                        >
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-slate-500">Criar Nova Tabela</span>
                        </button>
                    </div>
                </div>
            ) : (
                // === VISÃO 2: DETALHES DA TABELA ===
                <div className="max-w-5xl mx-auto animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setViewMode('list')} className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-xl text-slate-500 transition">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tabelaSelecionada?.nome}</h1>
                                    <button onClick={() => openModalTabela(tabelaSelecionada)} className="text-slate-400 hover:text-blue-600 transition"><Edit2 className="h-4 w-4" /></button>
                                </div>
                                <p className="text-slate-500 text-sm">Gerir os preços específicos aplicados nesta tabela.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddTodosModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition shadow-sm"
                            >
                                <CheckCheck className="h-4 w-4 text-blue-500" /> Importar Catálogo
                            </button>
                            <button
                                onClick={() => openModalItem()}
                                className="flex items-center gap-2 px-5 py-2 text-white text-sm font-bold rounded-xl hover:-translate-y-0.5 transition shadow-lg"
                                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                            >
                                <Plus className="h-4 w-4" /> Adicionar Único
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                            <Settings className="h-5 w-5 text-slate-400" />
                            <h3 className="font-bold text-slate-700">Preços Configurados ({tabelaItens.length})</h3>
                        </div>

                        {tabelaItens.length === 0 ? (
                            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <ScrollText className="h-8 w-8" />
                                </div>
                                <p className="font-bold text-lg text-slate-700 mb-1">Tabela Vazia</p>
                                <p className="max-w-md mx-auto">Esta tabela ainda não tem preços definidos. Pode importar todos os serviços do seu catálogo de uma vez ou adicionar individualmente.</p>
                                <button onClick={() => setShowAddTodosModal(true)} className="mt-6 font-bold text-blue-600 hover:text-blue-700 hover:underline">Importar Catálogo Agora</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Serviço</th>
                                        <th className="px-6 py-4">Preço Original</th>
                                        <th className="px-6 py-4">Preço na Tabela</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {tabelaItens.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{item.servico?.nome || 'Serviço Removido'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-400 line-through">
                                                    {item.servico?.precoBase?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                    {item.preco.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModalItem(item)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition shadow-sm" title="Editar Preço">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => confirmDeleteItem(item)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition shadow-sm" title="Remover da Tabela">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageContainer>
    );
}