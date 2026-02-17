import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { notify } from '../utils/notify';
import {
    User, Mail, Phone, MapPin, FileText,
    Save, Loader2, Building2
} from 'lucide-react';
import type { UserSession } from '../types';

export function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Mantemos os estados para a página continuar a ser pintada com as cores do lab, 
    // mas o utilizador já não vai conseguir alterá-los por aqui.
    const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('elolab_user_color') || '#2563EB');
    const [logoUrl, setLogoUrl] = useState(localStorage.getItem('elolab_user_logo') || '');

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

            if (perfil.corPrimaria) setPrimaryColor(perfil.corPrimaria);
            if (perfil.logoUrl) setLogoUrl(perfil.logoUrl);

        } catch (error) {
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nome, emailContato, telefone, nif, endereco,
            // Enviamos as cores que já estavam na conta para não as perder
            corPrimaria: primaryColor,
            logoUrl: logoUrl
        };

        try {
            const endpoint = userType === 'Laboratorio' ? '/Laboratorios/me' : '/Clinicas/me';
            await api.put(endpoint, payload);

            localStorage.setItem('elolab_user_color', primaryColor);
            if (logoUrl) {
                localStorage.setItem('elolab_user_logo', logoUrl);
            } else {
                localStorage.removeItem('elolab_user_logo');
            }

            notify.success("Perfil atualizado!");

        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    if (loading || !user) return <div className="p-8 text-slate-400">Carregando perfil...</div>;

    return (
        <PageContainer primaryColor={primaryColor}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Meu Perfil</h1>
                    <p className="text-slate-500">Gerencie os dados cadastrais da sua conta.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* A secção de alterar logo e cor foi inteiramente removida daqui! */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                            <Building2 className="h-4 w-4" /> Dados Cadastrais
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Nome da Empresa</label>
                                <div className="relative">
                                    <User className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                    <input required type="text" value={nome} onChange={e => setNome(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none focus:bg-white transition"
                                           onFocus={(e) => e.target.style.borderColor = primaryColor}
                                           onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Email Comercial</label>
                                    <div className="relative">
                                        <Mail className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)}
                                               className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none transition"
                                               onFocus={(e) => e.target.style.borderColor = primaryColor}
                                               onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Telefone</label>
                                    <div className="relative">
                                        <Phone className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
                                               className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none transition"
                                               onFocus={(e) => e.target.style.borderColor = primaryColor}
                                               onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="md:col-span-1">
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">NIF</label>
                                    <div className="relative">
                                        <FileText className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input type="text" value={nif} onChange={e => setNif(e.target.value)}
                                               className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none transition"
                                               onFocus={(e) => e.target.style.borderColor = primaryColor}
                                               onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Endereço</label>
                                    <div className="relative">
                                        <MapPin className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
                                               className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-medium outline-none transition"
                                               onFocus={(e) => e.target.style.borderColor = primaryColor}
                                               onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={saving}
                                className="flex items-center gap-2 rounded-xl px-8 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-70"
                                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}60` }}
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Salvar Alterações</>}
                        </button>
                    </div>
                </form>
            </div>
        </PageContainer>
    );
}