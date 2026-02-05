import { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
    Plus, Trash2, Clock, Loader2, Save, X, Edit, Search
} from 'lucide-react';
import type { Servico } from '../types';

const MATERIAIS = ["Zircónia", "E-max", "Metal", "Acrílico", "Cerâmica", "Outros"];

export function Services() {
    // === WHITE LABEL ===
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    // Gradiente de Fundo
    const backgroundStyle = {
        background: `linear-gradient(180deg, ${primaryColor}40 0%, #f8fafc 100%)`,
        backgroundColor: '#f8fafc'
    };
    // ===================

    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filtroMaterial, setFiltroMaterial] = useState('Todos');
    const [busca, setBusca] = useState('');
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

    const servicosFiltrados = servicos.filter(s => {
        const matchesMaterial = filtroMaterial === 'Todos' || s.material === filtroMaterial;
        const matchesBusca = s.nome.toLowerCase().includes(busca.toLowerCase());
        return matchesMaterial && matchesBusca;
    });

    if (loading) return <div className="p-8 text-slate-400">Carregando serviços...</div>;

    return (
        <div className="min-h-screen p-8 transition-all duration-500" style={backgroundStyle}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Serviços & Preços</h1>
                <p className="text-slate-500">Gerencie o seu catálogo de serviços.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Form */}
                <div className="lg:col-span-1">
                    <div className={`sticky top-6 rounded-2xl border p-6 shadow-sm transition-colors bg-white border-slate-200`}
                         style={idEdicao ? { borderColor: primaryColor, backgroundColor: `${primaryColor}05` } : {}}>

                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900" style={idEdicao ? { color: primaryColor } : {}}>
                                {idEdicao ? 'Editar Serviço' : 'Novo Serviço'}
                            </h2>
                            {idEdicao && (
                                <button onClick={handleCancelEdit} type="button" className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-600">
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Nome</label>
                                <input required type="text" value={nome} onChange={e => setNome(e.target.value)}
                                       className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition"
                                       onFocus={(e) => e.target.style.borderColor = primaryColor}
                                       onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                       placeholder="Ex: Coroa Total" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Material</label>
                                <select value={material} onChange={e => setMaterial(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition"
                                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}>
                                    {MATERIAIS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Preço (€)</label>
                                    <input required type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition"
                                           onFocus={(e) => e.target.style.borderColor = primaryColor}
                                           onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                           placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase">Prazo (Dias)</label>
                                    <input required type="number" value={prazo} onChange={e => setPrazo(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition"
                                           onFocus={(e) => e.target.style.borderColor = primaryColor}
                                           onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                           placeholder="5" />
                                </div>
                            </div>
                            <button disabled={saving} type="submit"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : idEdicao ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {idEdicao ? 'Salvar Alterações' : 'Adicionar Serviço'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Listagem */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute top-3 left-4 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition"
                                onFocus={(e) => e.target.style.borderColor = primaryColor}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                            <button onClick={() => setFiltroMaterial('Todos')}
                                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition border`}
                                    style={filtroMaterial === 'Todos' ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }}
                            >
                                Todos
                            </button>
                            {MATERIAIS.map(m => (
                                <button key={m} onClick={() => setFiltroMaterial(m)}
                                        className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition border`}
                                        style={filtroMaterial === m ? { backgroundColor: primaryColor, color: 'white', borderColor: primaryColor } : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }}
                                >
                                    {m}
                                </button>
                            ))}
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
                                            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl font-bold text-sm"
                                                 style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                                            >
                                                {s.material ? s.material.substring(0, 2).toUpperCase() : 'GE'}
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
                                            <span className="font-black text-slate-900 text-base">
                                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.precoBase)}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(s)} className="rounded-lg p-2 transition hover:bg-slate-100" style={{ color: primaryColor }}>
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(s.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
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
    );
}