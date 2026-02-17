import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import { Building2, Search, CheckCircle, XCircle, Edit, ShieldAlert, Palette, Image as ImageIcon, Tag, Plus, Trash2, Clock, Layers } from 'lucide-react';

export function Admin() {
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    const [laboratorios, setLaboratorios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    const [labEmEdicao, setLabEmEdicao] = useState<any | null>(null);
    const [novaCor, setNovaCor] = useState('');
    const [novoLogo, setNovoLogo] = useState<File | null>(null);

    const [labServicos, setLabServicos] = useState<any | null>(null);
    const [listaServicos, setListaServicos] = useState<any[]>([]);
    const [materiaisOficiais, setMateriaisOficiais] = useState<any[]>([]); // <--- ARMAZENA MATERIAIS DO LAB
    const [loadingServicos, setLoadingServicos] = useState(false);

    const [novoServico, setNovoServico] = useState({
        nome: '',
        precoBase: '',
        material: 'Geral',
        prazoDiasUteis: '5'
    });

    useEffect(() => {
        carregarLaboratorios();
    }, []);

    async function carregarLaboratorios() {
        try {
            const res = await api.get('/Laboratorios');
            setLaboratorios(res.data);
        } catch (error) {
            notify.error("Erro ao carregar os laboratórios.");
        } finally {
            setLoading(false);
        }
    }

    async function toggleStatusAtivo(labId: string, statusAtual: boolean) {
        try {
            await api.patch(`/Laboratorios/${labId}/status`, { ativo: !statusAtual });
            notify.success(statusAtual ? "Laboratório Bloqueado" : "Laboratório Ativado");
            carregarLaboratorios();
        } catch (error) {
            notify.error("Erro ao alterar o status.");
        }
    }

    async function salvarEdicao(e: React.FormEvent) {
        e.preventDefault();
        if (!labEmEdicao) return;
        try {
            const formData = new FormData();
            formData.append('corPrimaria', novaCor);
            if (novoLogo) formData.append('logo', novoLogo);

            await api.put(`/Laboratorios/${labEmEdicao.id}/aparencia`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            notify.success("Aparência atualizada com sucesso!");
            setLabEmEdicao(null);
            carregarLaboratorios();
        } catch (error) {
            notify.error("Erro ao atualizar o laboratório.");
        }
    }

    // ==========================================================
    // FUNÇÕES DE CONCIERGE DE SERVIÇOS
    // ==========================================================

    async function abrirModalServicos(lab: any) {
        setLabServicos(lab);
        setLoadingServicos(true);
        try {
            // BUSCA EM PARALELO: Serviços e a lista de Materiais oficial do Lab
            const [resServicos, resMateriais] = await Promise.all([
                api.get(`/Laboratorios/${lab.id}/servicos`),
                api.get(`/Materiais/admin/${lab.id}`)
            ]);

            setListaServicos(resServicos.data);
            setMateriaisOficiais(resMateriais.data);
        } catch (error) {
            notify.error("Erro ao carregar dados do laboratório.");
        } finally {
            setLoadingServicos(false);
        }
    }

    async function adicionarServicoAdmin(e: React.FormEvent) {
        e.preventDefault();
        if (!labServicos || !novoServico.nome || !novoServico.precoBase) return;

        try {
            const res = await api.post(`/Laboratorios/${labServicos.id}/servicos`, {
                nome: novoServico.nome,
                precoBase: parseFloat(novoServico.precoBase),
                material: novoServico.material,
                prazoDiasUteis: parseInt(novoServico.prazoDiasUteis),
                ativo: true
            });

            setListaServicos(prev => [...prev, res.data]);

            // Se o material for novo, adiciona à lista local de sugestões para não precisar de refresh
            if (!materiaisOficiais.find(m => m.nome.toLowerCase() === novoServico.material.toLowerCase())) {
                setMateriaisOficiais(prev => [...prev, { nome: novoServico.material }]);
            }

            setNovoServico({ nome: '', precoBase: '', material: 'Geral', prazoDiasUteis: '5' });
            notify.success("Serviço adicionado para o cliente!");
        } catch (error) {
            notify.error("Erro ao criar serviço.");
        }
    }

    async function removerServicoAdmin(servicoId: string) {
        if (!labServicos || !window.confirm("Tem a certeza que deseja apagar este serviço?")) return;

        try {
            await api.delete(`/Laboratorios/${labServicos.id}/servicos/${servicoId}`);
            setListaServicos(prev => prev.filter(s => s.id !== servicoId));
            notify.success("Serviço apagado.");
        } catch (error) {
            notify.error("Erro ao apagar serviço.");
        }
    }

    const labsFiltrados = laboratorios.filter(l =>
        l.nome.toLowerCase().includes(busca.toLowerCase()) ||
        l.emailContato.toLowerCase().includes(busca.toLowerCase())
    );

    if (loading) return <div className="flex h-screen items-center justify-center">A carregar painel mestre...</div>;

    return (
        <PageContainer primaryColor={primaryColor}>
            {/* === MODAL DE EDIÇÃO DE APARÊNCIA === */}
            {labEmEdicao && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Palette className="h-5 w-5" style={{ color: primaryColor }} /> Personalizar Cliente
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">A editar aparência de <strong>{labEmEdicao.nome}</strong></p>

                        <form onSubmit={salvarEdicao} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cor Primária (Hexadecimal)</label>
                                <div className="flex gap-3">
                                    <input type="color" value={novaCor} onChange={e => setNovaCor(e.target.value)} className="h-10 w-16 cursor-pointer rounded border border-slate-200" />
                                    <input type="text" value={novaCor} onChange={e => setNovaCor(e.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 font-mono text-sm uppercase" placeholder="#2563EB" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Novo Logótipo</label>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl border border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                                        <ImageIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="file" accept="image/png, image/jpeg" onChange={e => setNovoLogo(e.target.files ? e.target.files[0] : null)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setLabEmEdicao(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 rounded-xl py-3 font-bold text-white shadow-lg" style={{ backgroundColor: primaryColor }}>Guardar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODAL DE GESTÃO DE SERVIÇOS (CONCIERGE) === */}
            {labServicos && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Tag className="h-5 w-5" style={{ color: primaryColor }} /> Gerir Serviços (Concierge)
                                </h3>
                                <p className="text-sm text-slate-500">A operar em nome de <strong>{labServicos.nome}</strong></p>
                            </div>
                            <button onClick={() => setLabServicos(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Formulário Completo para Criar Serviço baseado no C# */}
                        <form onSubmit={adicionarServicoAdmin} className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex-1 min-w-[200px]">
                                <input
                                    type="text" required placeholder="Nome do Serviço (ex: Coroa Zircônia)"
                                    value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="w-40">
                                <div className="relative">
                                    <Layers className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        list="materiais-lab"
                                        type="text" required placeholder="Material"
                                        value={novoServico.material} onChange={e => setNovoServico({...novoServico, material: e.target.value})}
                                        className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                    {/* LISTA DE MATERIAIS OFICIAIS DO LAB */}
                                    <datalist id="materiais-lab">
                                        {materiaisOficiais.map((m: any, idx: number) => (
                                            <option key={idx} value={m.nome} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="w-32">
                                <div className="relative">
                                    <Clock className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="number" min="1" required placeholder="Dias" title="Prazo em Dias Úteis"
                                        value={novoServico.prazoDiasUteis} onChange={e => setNovoServico({...novoServico, prazoDiasUteis: e.target.value})}
                                        className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="w-32">
                                <input
                                    type="number" step="0.01" required placeholder="Preço (€)"
                                    value={novoServico.precoBase} onChange={e => setNovoServico({...novoServico, precoBase: e.target.value})}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-blue-600 outline-none focus:border-blue-500"
                                />
                            </div>
                            <button type="submit" className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105" style={{ backgroundColor: primaryColor }}>
                                <Plus className="h-4 w-4" /> Adicionar
                            </button>
                        </form>

                        {/* Lista de Serviços */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar border rounded-xl">
                            {loadingServicos ? (
                                <div className="p-8 text-center text-slate-500">A carregar serviços do cliente...</div>
                            ) : listaServicos.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">Este laboratório ainda não tem serviços.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 sticky top-0 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Serviço</th>
                                        <th className="px-4 py-3">Material</th>
                                        <th className="px-4 py-3 text-center">Prazo</th>
                                        <th className="px-4 py-3 text-right">Preço Base</th>
                                        <th className="px-4 py-3 text-right">Ação</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {listaServicos.map(servico => (
                                        <tr key={servico.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{servico.nome}</td>
                                            <td className="px-4 py-3 text-slate-500">{servico.material}</td>
                                            <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                        <Clock className="h-3 w-3" /> {servico.prazoDiasUteis} dias
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                                                {Number(servico.precoBase || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => removerServicoAdmin(servico.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Apagar Serviço">
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
                </div>
            )}

            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <ShieldAlert className="h-8 w-8 text-red-500" /> Super Admin
                        </h1>
                        <p className="text-slate-500 mt-1">Gestão global de clientes e laboratórios da EloLab.</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text" value={busca} onChange={e => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:border-blue-500 outline-none transition"
                            placeholder="Procurar laboratório..."
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Laboratório</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4">Status Acesso</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {labsFiltrados.map(lab => (
                            <tr key={lab.id} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {lab.logoUrl ? (
                                            <img src={lab.logoUrl} className="h-10 w-10 rounded-lg object-cover border" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-slate-400" />
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-bold text-slate-900 block">{lab.nome}</span>
                                            <span className="text-xs text-slate-500">NIF: {lab.nif || 'Não def.'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="block font-medium">{lab.emailContato}</span>
                                    <span className="text-xs text-slate-500">{lab.telefone || '--'}</span>
                                </td>
                                <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${lab.ativo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {lab.ativo ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {lab.ativo ? 'Autorizado' : 'Bloqueado'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => abrirModalServicos(lab)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Gerir Serviços (Concierge)"
                                        >
                                            <Tag className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => { setLabEmEdicao(lab); setNovaCor(lab.corPrimaria || '#2563EB'); }}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Editar Design"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => toggleStatusAtivo(lab.id, lab.ativo)}
                                            className={`p-2 rounded-lg transition ${lab.ativo ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                            title={lab.ativo ? "Bloquear Acesso" : "Liberar Acesso"}
                                        >
                                            {lab.ativo ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageContainer>
    );
}