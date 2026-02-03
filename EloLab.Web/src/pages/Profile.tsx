import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, FileText,
    Save, Loader2, Building2
} from 'lucide-react';
import type { UserSession } from '../types';

export function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userType, setUserType] = useState('');
    const [nome, setNome] = useState('');
    const [emailContato, setEmailContato] = useState('');
    const [telefone, setTelefone] = useState('');
    const [nif, setNif] = useState('');
    const [endereco, setEndereco] = useState('');
    const [user, setUser] = useState<UserSession | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const res = await api.get('/Auth/me');
            const data = res.data as UserSession;
            setUser(data);
            setUserType(data.tipo);
            const perfil = data.meusDados;
            setNome(perfil.nome || '');
            setEmailContato(perfil.emailContato || '');
            setTelefone(perfil.telefone || '');
            setNif(perfil.nif || '');
            setEndereco(perfil.endereco || '');
        } catch (error) {
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const payload = { nome, emailContato, telefone, nif, endereco };
        try {
            const endpoint = userType === 'Laboratorio' ? '/Laboratorios/me' : '/Clinicas/me';
            await api.put(endpoint, payload);
            alert("✅ Perfil atualizado com sucesso!");
        } catch (error) {
            alert("Erro ao atualizar perfil.");
        } finally {
            setSaving(false);
        }
    }

    // Se estiver carregando OU se user for nulo, mostra loading
    if (loading || !user) return <div className="p-8 text-slate-400">Carregando perfil...</div>;

    return (
        <div className="p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Meu Perfil</h1>
                    <p className="text-slate-500">Mantenha seus dados comerciais atualizados.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{nome || 'Minha Empresa'}</h2>
                            {/* CORREÇÃO AQUI: Verificação segura antes do substring */}
                            <p className="text-sm text-slate-500">
                                ID: #{user.id ? user.id.substring(0,8) : '...'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Nome da Empresa / Clínica</label>
                            <div className="relative">
                                <User className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                <input required type="text" value={nome} onChange={e => setNome(e.target.value)}
                                       className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none focus:border-blue-500 focus:bg-white transition" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Email de Contato</label>
                                <div className="relative">
                                    <Mail className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                    <input type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none focus:border-blue-500 focus:bg-white transition"
                                           placeholder="contato@empresa.com" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                    <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none focus:border-blue-500 focus:bg-white transition"
                                           placeholder="+351 999 999 999" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="md:col-span-1">
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">NIF</label>
                                <div className="relative">
                                    <FileText className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                    <input type="text" value={nif} onChange={e => setNif(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none focus:border-blue-500 focus:bg-white transition"
                                           placeholder="000 000 000" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Endereço Completo</label>
                                <div className="relative">
                                    <MapPin className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                    <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none focus:border-blue-500 focus:bg-white transition"
                                           placeholder="Rua Exemplo, 123 - Porto" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70 hover:-translate-y-0.5">
                                {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Salvar Alterações</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}