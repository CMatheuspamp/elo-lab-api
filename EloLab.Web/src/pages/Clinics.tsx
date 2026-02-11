import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    Building2, Plus, Search, Mail, Phone,
    MapPin, FileText, Loader2, X, Save, Trash2, Unlink, AlertTriangle
} from 'lucide-react';
import type { UserSession } from '../types';

export function Clinics() {
    const primaryColor = localStorage.getItem('elolab_user_color') || '#2563EB';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserSession | null>(null);

    // Lista de Clínicas
    const [clinicas, setClinicas] = useState<any[]>([]);
    const [busca, setBusca] = useState('');

    // Modal de Cadastro
    const [showModal, setShowModal] = useState(false);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [nif, setNif] = useState('');
    const [endereco, setEndereco] = useState('');

    // === ESTADO DO MODAL DE CONFIRMAÇÃO (DELETE) ===
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        clinica: any | null;
    }>({ isOpen: false, clinica: null });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const meResponse = await api.get('/Auth/me');
            const userData = meResponse.data;
            setUser(userData);

            if (userData.tipo === 'Laboratorio') {
                const clinicasRes = await api.get('/Clinicas');
                setClinicas(clinicasRes.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddClinica(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            const payload = { laboratorioId: user.meusDados.id, nome, email, telefone, nif, endereco };
            await api.post('/Clinicas', payload);
            notify.success('Clínica cadastrada com sucesso!');
            setShowModal(false);
            setNome(''); setEmail(''); setTelefone(''); setNif(''); setEndereco('');
            loadData();
        } catch (error) {
            // Interceptor lida com erro
        } finally {
            setSaving(false);
        }
    }

    // === FUNÇÃO DE APAGAR / DESVINCULAR ===
    async function handleConfirmDelete() {
        if (!deleteModal.clinica) return;

        try {
            await api.delete(`/Clinicas/${deleteModal.clinica.id}`);

            // Mensagem personalizada dependendo do tipo
            if (deleteModal.clinica.usuarioId) {
                notify.success('Vínculo com a clínica encerrado.');
            } else {
                notify.success('Clínica removida com sucesso.');
            }

            // Atualiza a lista visualmente sem precisar de reload
            setClinicas(prev => prev.filter(c => c.id !== deleteModal.clinica.id));
        } catch (error) {
            notify.error("Erro ao remover clínica.");
        } finally {
            setDeleteModal({ isOpen: false, clinica: null });
        }
    }

    const clinicasFiltradas = clinicas.filter(c =>
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (c.nif && c.nif.includes(busca))
    );

    // Helpers para texto do modal
    const isManual = deleteModal.clinica && !deleteModal.clinica.usuarioId;
    const modalTitle = isManual ? 'Apagar Clínica?' : 'Encerrar Parceria?';
    const modalMessage = isManual
        ? `Tem a certeza que deseja apagar a clínica "${deleteModal.clinica?.nome}"? Todos os dados deste registo manual serão perdidos permanentemente.`
        : `Tem a certeza que deseja desvincular a clínica "${deleteModal.clinica?.nome}"? Ela deixará de ter acesso ao seu laboratório, mas a conta deles continuará a existir.`;
    const confirmButtonText = isManual ? 'Sim, Apagar' : 'Sim, Desvincular';

    if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <PageContainer primaryColor={primaryColor}>

            {/* === MODAL DE CONFIRMAÇÃO (DELETE) === */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
                            <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{modalTitle}</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            {modalMessage}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, clinica: null })}
                                className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 rounded-xl py-3 font-bold text-white shadow-lg shadow-red-200 bg-red-600 hover:bg-red-700 transition"
                            >
                                {confirmButtonText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL DE CADASTRO === */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Cadastrar Clínica</h2>
                                <p className="text-sm text-slate-500">Adicione um parceiro manualmente.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-slate-200 text-slate-400 transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddClinica} className="p-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Nome da Clínica *</label>
                                <div className="relative">
                                    <Building2 className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                    <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                    <div className="relative">
                                        <Phone className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">NIF</label>
                                    <div className="relative">
                                        <FileText className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                        <input type="text" value={nif} onChange={e => setNif(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Morada</label>
                                    <div className="relative">
                                        <MapPin className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                        <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Cadastrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === CABEÇALHO === */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Minhas Clínicas</h1>
                    <p className="text-slate-500">Faça a gestão dos seus parceiros e adicione clínicas manuais.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 w-fit"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                >
                    <Plus className="h-5 w-5" /> Adicionar Clínica
                </button>
            </div>

            {/* === PESQUISA E LISTA === */}
            <div className="space-y-6">
                <div className="relative max-w-md">
                    <Search className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                    <input type="text" placeholder="Pesquisar clínica por nome ou NIF..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition shadow-sm" onFocus={(e) => e.target.style.borderColor = primaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Clínica</th>
                            <th className="px-6 py-4">Contactos</th>
                            <th className="px-6 py-4 hidden sm:table-cell">Localização / NIF</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {clinicasFiltradas.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50 transition group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                                            {c.nome.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 block text-base">{c.nome}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 space-y-1">
                                    {c.telefone && <div className="flex items-center gap-2 text-slate-600"><Phone className="h-3 w-3 text-slate-400"/> {c.telefone}</div>}
                                    {c.emailContato && <div className="flex items-center gap-2 text-slate-600"><Mail className="h-3 w-3 text-slate-400"/> {c.emailContato}</div>}
                                    {!c.telefone && !c.emailContato && <span className="text-slate-400 italic text-xs">Sem contactos</span>}
                                </td>
                                <td className="px-6 py-4 space-y-1 hidden sm:table-cell">
                                    <div className="flex items-center gap-2"><FileText className="h-3 w-3 text-slate-400"/> {c.nif || <span className="text-slate-300 italic text-xs">Sem NIF</span>}</div>
                                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-400"/> <span className="truncate max-w-[150px] block">{c.endereco || <span className="text-slate-300 italic text-xs">Sem Morada</span>}</span></div>
                                </td>
                                <td className="px-6 py-4">
                                    {c.usuarioId ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                                            Com Acesso
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500">
                                            Manual
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, clinica: c })}
                                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                                        title={c.usuarioId ? "Encerrar Parceria" : "Apagar Clínica"}
                                    >
                                        {c.usuarioId ? <Unlink className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {clinicasFiltradas.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center">
                            <Building2 className="h-12 w-12 text-slate-200 mb-3" />
                            <p className="text-slate-500 font-medium">Nenhuma clínica encontrada.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}