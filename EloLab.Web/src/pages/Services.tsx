import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Tag, Clock, Euro, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Servico } from '../types';

export function Services() {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const navigate = useNavigate();

    // Estados do formulário de novo serviço
    const [nome, setNome] = useState('');
    const [preco, setPreco] = useState('');
    const [prazo, setPrazo] = useState('');

    useEffect(() => {
        loadServicos();
    }, []);

    async function loadServicos() {
        try {
            const response = await api.get('/Servicos');
            setServicos(response.data);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddServico(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true);
        try {
            await api.post('/Servicos', {
                nome,
                precoBase: parseFloat(preco),
                prazoDiasUteis: parseInt(prazo),
                descricao: ""
            });
            setNome(''); setPreco(''); setPrazo('');
            loadServicos(); // Recarrega a lista
        } catch (error) {
            alert("Erro ao salvar serviço.");
        } finally {
            setAdding(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            <div className="mx-auto max-w-5xl">

                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                </button>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

                    {/* Formulário de Cadastro */}
                    <div className="md:col-span-1">
                        <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-bold text-slate-900">Novo Serviço</h2>
                            <form onSubmit={handleAddServico} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Nome do Serviço</label>
                                    <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Ex: Coroa de Zircônia" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Preço (€)</label>
                                        <input required type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Prazo (Dias)</label>
                                        <input required type="number" value={prazo} onChange={e => setPrazo(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500" placeholder="5" />
                                    </div>
                                </div>
                                <button disabled={adding} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">
                                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar à Tabela
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Listagem de Serviços */}
                    <div className="md:col-span-2">
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h2 className="font-bold text-slate-800 text-lg">Minha Tabela de Preços</h2>
                            </div>

                            {loading ? (
                                <div className="p-10 text-center text-slate-400">Carregando serviços...</div>
                            ) : servicos.length === 0 ? (
                                <div className="p-10 text-center text-slate-400">Sua tabela está vazia. Adicione o primeiro serviço ao lado.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {servicos.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 rounded-lg bg-blue-50 p-2 text-blue-600">
                                                    <Tag className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{s.nome}</p>
                                                    <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" /> {s.precoBase.toFixed(2)}</span>
                                                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.prazoDiasUteis ?? 5} dias úteis</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-600 transition">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
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