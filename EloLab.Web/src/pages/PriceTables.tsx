import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    ScrollText, Plus, ArrowLeft,
    Edit2, DollarSign, Loader2, X, Trash2, AlertTriangle
} from 'lucide-react';

export function PriceTables() {
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    // Estados de Controle
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

    // Dados
    const [tabelas, setTabelas] = useState<any[]>([]);
    const [tabelaSelecionada, setTabelaSelecionada] = useState<any>(null);
    const [servicosMestre, setServicosMestre] = useState<any[]>([]); // O Catálogo completo
    const [tabelaItens, setTabelaItens] = useState<any[]>([]);

    // Modals
    const [showModalTabela, setShowModalTabela] = useState(false);
    const [showModalItem, setShowModalItem] = useState(false);

    // Modal de Confirmação (Delete)
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type: 'tabela' | 'item' | null;
        targetId: string;
        nome?: string;
    }>({ isOpen: false, type: null, targetId: '' });

    // Form Tabela
    const [nomeTabela, setNomeTabela] = useState('');

    // Form Item
    const [selectedServicoId, setSelectedServicoId] = useState('');
    const [precoItem, setPrecoItem] = useState('');
    const [editandoItem, setEditandoItem] = useState<any>(null); // Se não for null, estamos editando

    useEffect(() => {
        loadTabelas();
    }, []);

    // === CARREGAMENTOS ===
    async function loadTabelas() {
        try {
            const res = await api.get('/TabelasPrecos');
            setTabelas(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function openTabelaDetails(tabela: any) {
        setLoading(true);
        try {
            // 1. Carrega os detalhes da tabela (itens)
            const resDetalhes = await api.get(`/TabelasPrecos/${tabela.id}`);
            setTabelaItens(resDetalhes.data.itens || []);
            setTabelaSelecionada(tabela);

            // 2. Carrega o Catálogo Mestre (para o dropdown de adicionar)
            const resServicos = await api.get('/Servicos');
            setServicosMestre(resServicos.data);

            setViewMode('details');
        } catch (e) {
            notify.error("Erro ao abrir tabela.");
        } finally {
            setLoading(false);
        }
    }

    // === AÇÕES DE TABELA (CRIAR) ===
    async function handleCriarTabela(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await api.post('/TabelasPrecos', { nome: nomeTabela });
            setTabelas([...tabelas, res.data]);
            notify.success("Tabela criada!");
            setShowModalTabela(false);
            setNomeTabela('');
        } catch (e) {
            notify.error("Erro ao criar tabela.");
        }
    }

    // === AÇÕES DE ITEM (ADICIONAR/EDITAR) ===
    function openModalItem(itemExistente?: any) {
        if (itemExistente) {
            // Modo Edição
            setEditandoItem(itemExistente);
            setSelectedServicoId(itemExistente.servicoId);
            setPrecoItem(itemExistente.preco);
        } else {
            // Modo Criação
            setEditandoItem(null);
            setSelectedServicoId('');
            setPrecoItem('');
        }
        setShowModalItem(true);
    }

    async function handleSaveItem(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedServicoId || !precoItem) return;

        try {
            const payload = {
                servicoId: selectedServicoId,
                preco: parseFloat(precoItem)
            };

            // O Backend é inteligente: se já existe, atualiza. Se não, cria.
            await api.post(`/TabelasPrecos/${tabelaSelecionada.id}/itens`, payload);

            notify.success("Preço salvo com sucesso!");

            // Recarrega os itens da tabela para atualizar a lista
            const res = await api.get(`/TabelasPrecos/${tabelaSelecionada.id}`);
            setTabelaItens(res.data.itens);

            setShowModalItem(false);
        } catch (e) {
            notify.error("Erro ao salvar preço.");
        }
    }

    // === LÓGICA DE DELETE (NOVO) ===
    function confirmDeleteTabela(e: React.MouseEvent, tabela: any) {
        e.stopPropagation(); // Impede entrar na tabela ao clicar no lixo
        setDeleteModal({ isOpen: true, type: 'tabela', targetId: tabela.id, nome: tabela.nome });
    }

    function confirmDeleteItem(item: any) {
        setDeleteModal({ isOpen: true, type: 'item', targetId: item.id, nome: item.servico?.nome });
    }

    async function handleDelete() {
        try {
            if (deleteModal.type === 'tabela') {
                await api.delete(`/TabelasPrecos/${deleteModal.targetId}`);
                setTabelas(prev => prev.filter(t => t.id !== deleteModal.targetId));
                notify.success("Tabela removida.");
            }
            else if (deleteModal.type === 'item') {
                await api.delete(`/TabelasPrecos/${tabelaSelecionada.id}/itens/${deleteModal.targetId}`);
                setTabelaItens(prev => prev.filter(i => i.id !== deleteModal.targetId));
                notify.success("Serviço removido da tabela.");
            }
        } catch (error) {
            notify.error("Erro ao remover.");
        } finally {
            setDeleteModal({ isOpen: false, type: null, targetId: '' });
        }
    }

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
                            <button onClick={handleDelete} className="flex-1 rounded-xl py-3 font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition">Apagar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL CRIAR TABELA === */}
            {showModalTabela && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Nova Tabela de Preços</h2>
                        <form onSubmit={handleCriarTabela}>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome da Tabela</label>
                            <input autoFocus type="text" value={nomeTabela} onChange={e => setNomeTabela(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:border-blue-500" placeholder="Ex: Tabela VIP 2024" required />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModalTabela(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Criar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODAL ADICIONAR/EDITAR ITEM === */}
            {showModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editandoItem ? 'Editar Preço' : 'Adicionar Serviço à Tabela'}
                            </h2>
                            <button onClick={() => setShowModalItem(false)}><X className="h-5 w-5 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSaveItem} className="space-y-4">
                            {/* Dropdown de Serviços */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Serviço</label>
                                <select
                                    disabled={!!editandoItem}
                                    value={selectedServicoId}
                                    onChange={e => {
                                        setSelectedServicoId(e.target.value);
                                        const svc = servicosMestre.find(s => s.id === e.target.value);
                                        if (svc && !editandoItem) setPrecoItem(svc.precoBase);
                                    }}
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 bg-white"
                                    required
                                >
                                    <option value="">Selecione um serviço...</option>
                                    {servicosMestre.map(s => (
                                        <option key={s.id} value={s.id}>{s.nome} (Base: {s.precoBase}€)</option>
                                    ))}
                                </select>
                            </div>

                            {/* Preço */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Preço nesta Tabela (€)</label>
                                <div className="relative">
                                    <DollarSign className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                    <input
                                        type="number" step="0.01"
                                        value={precoItem}
                                        onChange={e => setPrecoItem(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 mt-2">
                                Salvar Preço
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= CONTEÚDO PRINCIPAL ================= */}

            {viewMode === 'list' ? (
                // === VISÃO 1: LISTA DE TABELAS ===
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Tabelas de Preços</h1>
                            <p className="text-slate-500 mt-1">Crie tabelas personalizadas para diferentes clínicas.</p>
                        </div>
                        <button
                            onClick={() => setShowModalTabela(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="h-5 w-5" /> Nova Tabela
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tabelas.map(tabela => (
                            <div
                                key={tabela.id}
                                onClick={() => openTabelaDetails(tabela)}
                                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                        <ScrollText className="h-6 w-6" />
                                    </div>
                                    {/* Botão de Excluir Tabela (Com stopPropagation) */}
                                    <button
                                        onClick={(e) => confirmDeleteTabela(e, tabela)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition z-10"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{tabela.nome}</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                                        {tabela.itens?.length || 0} Itens
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Card de Criar (Atalho) */}
                        <button
                            onClick={() => setShowModalTabela(true)}
                            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition gap-3 h-full min-h-[160px]"
                        >
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Plus className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-slate-500">Criar Nova Tabela</span>
                        </button>
                    </div>
                </div>
            ) : (
                // === VISÃO 2: DETALHES DA TABELA ===
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{tabelaSelecionada?.nome}</h1>
                            <p className="text-slate-500 text-sm">Gerir preços específicos desta tabela</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <ScrollText className="h-4 w-4" /> Itens na Tabela
                            </h3>
                            <button
                                onClick={() => openModalItem()}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition shadow-sm"
                            >
                                <Plus className="h-4 w-4" /> Adicionar Serviço
                            </button>
                        </div>

                        {tabelaItens.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <p>Esta tabela ainda não tem preços definidos.</p>
                                <p className="text-sm mt-1">Os pedidos usarão o preço base dos serviços.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">Serviço</th>
                                    <th className="px-6 py-3">Preço Personalizado</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {tabelaItens.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {item.servico?.nome || 'Serviço Removido'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">
                                            {item.preco.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => openModalItem(item)}
                                                className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition"
                                                title="Editar Preço"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            {/* Botão de Excluir Item */}
                                            <button
                                                onClick={() => confirmDeleteItem(item)}
                                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"
                                                title="Remover Serviço da Tabela"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </PageContainer>
    );
}