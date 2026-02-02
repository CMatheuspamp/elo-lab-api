import { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
    Plus, Trash2, Clock, Loader2, ArrowLeft,
    Save, X, Edit, Search // Adicionei Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Servico } from '../types';

const MATERIAIS = ["Zircónia", "E-max", "Metal", "Acrílico", "Cerâmica", "Outros"];

export function Services() {
    const navigate = useNavigate();

    // Estados de Dados
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados de Filtro
    const [filtroMaterial, setFiltroMaterial] = useState('Todos');
    const [busca, setBusca] = useState(''); // <--- Novo Estado de Busca

    // Estados do Formulário
    const [idEdicao, setIdEdicao] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [material, setMaterial] = useState('Zircónia');
    const [preco, setPreco] = useState('');
    const [prazo, setPrazo] = useState('');

    useEffect(() => {
        loadServicos();
    }, []);

    async function loadServicos() {
        try {
            const response = await api.get('/Servicos');
            setServicos(response.data);
        } catch (error) {
            console.error("Erro ao carregar serviços", error);
        } finally {
            setLoading(false);
        }
    }

    function handleEditClick(s: Servico) {
        setIdEdicao(s.id);
        setNome(s.nome);
        setMaterial(s.material || 'Outros');
        setPreco(s.precoBase.toString());
        setPrazo(s.prazoDiasUteis ? s.prazoDiasUteis.toString() : '5');
    }

    function handleCancelEdit() {
        setIdEdicao(null);
        setNome('');
        setMaterial('Zircónia');
        setPreco('');
        setPrazo('');
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nome,
            material,
            precoBase: parseFloat(preco),
            prazoDiasUteis: parseInt(prazo),
            descricao: ""
        };

        try {
            if (idEdicao) {
                await api.put(`/Servicos/${idEdicao}`, payload);
            } else {
                await api.post('/Servicos', payload);
            }
            handleCancelEdit();
            loadServicos();
        } catch (error) {
            alert("Erro ao salvar serviço.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem a certeza que deseja excluir?")) return;
        try {
            await api.delete(`/Servicos/${id}`);
            setServicos(servicos.filter(s => s.id !== id));
        } catch (error) {
            alert("Erro ao excluir.");
        }
    }

    // LÓGICA DE FILTRAGEM COMBINADA
    const servicosFiltrados = servicos.filter(s => {
        const matchesMaterial = filtroMaterial === 'Todos' || s.material === filtroMaterial;
        const matchesBusca = s.nome.toLowerCase().includes(busca.toLowerCase());
        return matchesMaterial && matchesBusca;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            <div className="mx-auto max-w-6xl">

                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                </button>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* Formulário */}
                    <div className="lg:col-span-1">
                        <div className={`sticky top-6 rounded-xl border p-6 shadow-sm transition-colors ${idEdicao ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>

                            <div className="mb-4 flex items-center justify-between">
                                <h2 className={`text-lg font-bold ${idEdicao ? 'text-blue-800' : 'text-slate-900'}`}>
                                    {idEdicao ? 'Editar Serviço' : 'Novo Serviço'}
                                </h2>
                                {idEdicao && (
                                    <button onClick={handleCancelEdit} type="button" className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Nome</label>
                                    <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Ex: Coroa Total" />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Material</label>
                                    <select value={material} onChange={e => setMaterial(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500">
                                        {MATERIAIS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Preço (€)</label>
                                        <input required type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Prazo (Dias)</label>
                                        <input required type="number" value={prazo} onChange={e => setPrazo(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500" placeholder="5" />
                                    </div>
                                </div>

                                <button disabled={saving} type="submit" className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white transition disabled:opacity-50 ${idEdicao ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : idEdicao ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    {idEdicao ? 'Atualizar' : 'Adicionar'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Listagem */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Filtros e Busca */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            {/* Filtro Material */}
                            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                                <button onClick={() => setFiltroMaterial('Todos')} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition ${filtroMaterial === 'Todos' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Todos</button>
                                {MATERIAIS.map(m => (
                                    <button key={m} onClick={() => setFiltroMaterial(m)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition ${filtroMaterial === m ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{m}</button>
                                ))}
                            </div>
                        </div>

                        {/* Barra de Busca */}
                        <div className="relative">
                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar por nome do serviço..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Tabela de Preços</h2>
                                <span className="text-xs font-semibold text-slate-400">{servicosFiltrados.length} itens</span>
                            </div>

                            {loading ? (
                                <div className="p-10 text-center text-slate-400 flex justify-center"><Loader2 className="animate-spin"/></div>
                            ) : servicosFiltrados.length === 0 ? (
                                <div className="p-10 text-center text-slate-400">Nenhum serviço encontrado.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {servicosFiltrados.map((s) => (
                                        <div key={s.id} className="group flex items-center justify-between p-5 hover:bg-slate-50 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                                                    {s.material ? s.material.substring(0, 2).toUpperCase() : 'GE'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{s.nome}</p>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{s.material || 'Geral'}</span>
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.prazoDiasUteis} dias</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-slate-900 text-sm sm:text-base">
                                                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.precoBase)}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditClick(s)} className="rounded p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"><Edit className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDelete(s.id)} className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}