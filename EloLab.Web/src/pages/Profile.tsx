import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer'; // <--- IMPORTADO
import {
    User, Mail, Phone, MapPin, FileText,
    Save, Loader2, Building2, Upload, Palette, Image as ImageIcon
} from 'lucide-react';
import type { UserSession } from '../types';

export function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // === WHITE LABEL ===
    const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('elolab_user_color') || '#2563EB');
    const [logoUrl, setLogoUrl] = useState(localStorage.getItem('elolab_user_logo') || '');

    const [userType, setUserType] = useState('');
    const [nome, setNome] = useState('');
    const [emailContato, setEmailContato] = useState('');
    const [telefone, setTelefone] = useState('');
    const [nif, setNif] = useState('');
    const [endereco, setEndereco] = useState('');
    const [user, setUser] = useState<UserSession | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // === CORREÇÃO DE URL DE IMAGEM ===
    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5036';
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanPath}`;
    };

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

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        const formData = new FormData();
        formData.append('arquivo', file);

        try {
            const res = await api.post('/Laboratorios/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLogoUrl(res.data.url);
        } catch (error) {
            alert("Erro ao enviar logo. Tente uma imagem menor (JPG/PNG).");
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nome, emailContato, telefone, nif, endereco,
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

            window.location.reload();
            alert("✅ Perfil e aparência atualizados!");

        } catch (error) {
            alert("Erro ao atualizar perfil.");
            setSaving(false);
        }
    }

    if (loading || !user) return <div className="p-8 text-slate-400">Carregando perfil...</div>;

    const isLab = userType === 'Laboratorio';

    return (
        // === PAGE CONTAINER ADICIONADO ===
        <PageContainer primaryColor={primaryColor}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Meu Perfil & Marca</h1>
                    <p className="text-slate-500">Gerencie seus dados e a identidade visual do laboratório.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-8">

                    {isLab && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                                <Palette className="h-4 w-4" /> Personalização (White Label)
                            </h3>

                            <div className="flex flex-col gap-8 md:flex-row md:items-start">
                                {/* Preview e Upload da Logo */}
                                <div className="flex flex-col items-center gap-4">
                                    <div
                                        className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-400"
                                        style={{ borderColor: `${primaryColor}60` }}
                                    >
                                        {logoUrl ? (
                                            <img src={getFullUrl(logoUrl)} alt="Logo" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <ImageIcon className="mx-auto h-8 w-8 mb-1 opacity-50" />
                                                <span className="text-xs font-bold">Sem Logo</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition hover:opacity-80"
                                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                    >
                                        <Upload className="h-3 w-3" /> Alterar Logo
                                    </button>
                                </div>

                                {/* Seletor de Cor */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-slate-700">Cor da Marca</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-12 w-20 cursor-pointer rounded-lg border border-slate-200 p-1"
                                            />
                                            <div className="text-sm text-slate-500">
                                                <p>Escolha a cor principal do seu sistema.</p>
                                                <p className="text-xs opacity-70">Hex: {primaryColor.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                        <p className="mb-3 text-xs font-bold uppercase text-slate-400">Pré-visualização</p>
                                        <div className="flex gap-3">
                                            <button type="button" className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md" style={{ backgroundColor: primaryColor }}>Botão Principal</button>
                                            <button type="button" className="rounded-lg border px-4 py-2 text-sm font-bold" style={{ borderColor: primaryColor, color: primaryColor }}>Botão Secundário</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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