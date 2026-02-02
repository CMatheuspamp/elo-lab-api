import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, FileText,
    Save, Loader2, ArrowLeft, Building2
} from 'lucide-react';
import type { UserSession } from '../types'; // Agora será usado na linha 34

export function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userType, setUserType] = useState('');

    // Estados do Formulário
    const [nome, setNome] = useState('');
    const [emailContato, setEmailContato] = useState('');
    const [telefone, setTelefone] = useState('');
    const [nif, setNif] = useState('');
    const [endereco, setEndereco] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const res = await api.get('/Auth/me');

            // AQUI ESTÁ A CORREÇÃO: Forçamos o tipo para UserSession
            const data = res.data as UserSession;
            const perfil = data.meusDados;

            setUserType(data.tipo);

            // Preenche o formulário
            setNome(perfil.nome || '');
            setEmailContato(perfil.emailContato || '');
            setTelefone(perfil.telefone || '');
            setNif(perfil.nif || '');
            setEndereco(perfil.endereco || '');

        } catch (error) {
            alert("Erro ao carregar perfil.");
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nome,
            emailContato,
            telefone,
            nif,
            endereco
        };

        try {
            // Usa o endpoint correto dependendo do tipo de usuário
            const endpoint = userType === 'Laboratorio' ? '/Laboratorios/me' : '/Clinicas/me';
            await api.put(endpoint, payload);
            alert("✅ Perfil atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar perfil.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-400"/></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            <div className="mx-auto max-w-2xl">

                <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                </button>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 border-b border-slate-100 pb-4 flex items-center gap-4">
                        <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Meu Perfil</h1>
                            <p className="text-sm text-slate-500">Mantenha seus dados atualizados para os parceiros.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">

                        {/* Nome */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome da Empresa / Clínica</label>
                            <div className="relative">
                                <User className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                <input required type="text" value={nome} onChange={e => setNome(e.target.value)}
                                       className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* Email e Telefone */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email de Contato</label>
                                <div className="relative">
                                    <Mail className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                    <input type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)}
                                           className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                           placeholder="contato@empresa.com" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                    <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
                                           className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                           placeholder="+351 999 999 999" />
                                </div>
                            </div>
                        </div>

                        {/* NIF e Endereço */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">NIF</label>
                            <div className="relative">
                                <FileText className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                <input type="text" value={nif} onChange={e => setNif(e.target.value)}
                                       className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                       placeholder="000 000 000" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Endereço Completo</label>
                            <div className="relative">
                                <MapPin className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                <textarea rows={3} value={endereco} onChange={e => setEndereco(e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                                          placeholder="Rua Exemplo, 123 - Porto" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70">
                                {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Salvar Alterações</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}