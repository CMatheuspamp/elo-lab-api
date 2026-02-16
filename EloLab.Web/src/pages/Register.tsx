import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { notify } from '../utils/notify';
import {
    Building2, Smile, User, Mail, Lock,
    FileText, Loader2, ArrowLeft, ArrowRight, CheckCircle2, ChevronRight,
    MapPin, Globe, ShieldCheck, Check, X
} from 'lucide-react';

declare global {
    interface Window {
        google: any;
    }
}

// Códigos de País (Focado em Portugal/Brasil mas expansível)
const COUNTRY_CODES = [
    { code: '+351', flag: '🇵🇹', name: 'PT' },
    { code: '+55', flag: '🇧🇷', name: 'BR' },
    { code: '+34', flag: '🇪🇸', name: 'ES' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+1', flag: '🇺🇸', name: 'US' },
];

export function Register() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenURL = searchParams.get('token');

    // Estados de Controlo do Wizard
    const [step, setStep] = useState<number>(0); // 0: Tipo, 1: Acesso, 2: Empresa
    const [tipoConta, setTipoConta] = useState<'laboratorio' | 'clinica' | null>(null);
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    // Passo 1: Dados de Acesso
    const [nomeResponsavel, setNomeResponsavel] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    // Passo 2: Dados da Empresa
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [nif, setNif] = useState('');
    const [countryCode, setCountryCode] = useState('+351');
    const [telefone, setTelefone] = useState('');

    // Morada (Google Autocomplete)
    const [moradaBusca, setMoradaBusca] = useState('');
    const [rua, setRua] = useState('');
    const [cidade, setCidade] = useState('');
    const [codigoPostal, setCodigoPostal] = useState('');
    const autocompleteInputRef = useRef<HTMLInputElement>(null);

    // === VALIDAÇÃO DE SENHA (Em tempo real) ===
    const isLengthValid = senha.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(senha);
    const hasNumber = /[0-9]/.test(senha);
    const isPasswordValid = isLengthValid && hasLetter && hasNumber;

    useEffect(() => {
        if (tokenURL) {
            setTipoConta('clinica');
            setStep(1); // Salta logo para o Passo 1 se vier por convite
            localStorage.setItem('elolab_token_convite', tokenURL);
        }
    }, [tokenURL]);

    // === INICIALIZAR GOOGLE PLACES AUTOCOMPLETE ===
    useEffect(() => {
        if (step === 2) {
            // Verifica se a API do Google já foi carregada
            if (!window.google) {
                const script = document.createElement('script');
                // IMPORTANTE: COLOCA A TUA API KEY AQUI 👇
                script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
                script.onload = initAutocomplete;
            } else {
                initAutocomplete();
            }
        }

        function initAutocomplete() {
            if (!autocompleteInputRef.current) return;

            const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
                types: ['address'],
                componentRestrictions: { country: ['pt', 'br'] } // Limita a PT e BR
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                let routeName = '';
                let localityName = '';
                let zipCode = '';

                for (const component of place.address_components || []) {
                    const types = component.types;
                    if (types.includes('route')) routeName = component.long_name;
                    if (types.includes('locality')) localityName = component.long_name;
                    if (types.includes('postal_code')) zipCode = component.long_name;
                }

                setMoradaBusca(place.formatted_address || place.name || '');
                setRua(routeName || place.name || '');
                setCidade(localityName);
                setCodigoPostal(zipCode);
            });
        }
    }, [step]);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const telefoneFinal = `${countryCode} ${telefone}`;

        try {
            if (tipoConta === 'laboratorio') {
                // NOTA: O teu C# precisará de estar pronto para receber Rua, Cidade e CodigoPostal
                const payload = {
                    nomeResponsavel, email, senha, nif,
                    telefone: telefoneFinal,
                    nomeLaboratorio: nomeEmpresa,
                    rua, cidade, codigoPostal
                };
                await api.post('/Auth/register/laboratorio', payload);
                notify.success('Laboratório registado com sucesso!');
            } else {
                const payload = {
                    nomeResponsavel, email, senha, nif,
                    telefone: telefoneFinal,
                    nomeClinica: nomeEmpresa,
                    rua, cidade, codigoPostal,
                    tokenConvite: tokenURL || null
                };
                await api.post('/Auth/register/clinica', payload);
                notify.success('Clínica registada com sucesso!');
            }
            setSucesso(true);
        } catch (error) {
            console.error(error);
            notify.error("Erro ao criar conta. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    }

    if (sucesso) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-300/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

                <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-white max-w-md w-full text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white mb-8 shadow-lg shadow-emerald-500/30 border-4 border-emerald-50">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Conta Criada!</h2>
                    <p className="text-slate-500 mb-10 text-lg leading-relaxed font-medium">
                        {tipoConta === 'laboratorio'
                            ? 'O seu laboratório foi registado com sucesso. Faça login para configurar a sua área.'
                            : 'A sua clínica foi registada. Já pode aceder ao portal e enviar trabalhos!'}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        Aceder à Plataforma
                    </button>
                </div>
            </div>
        );
    }

    const themeColor = !tipoConta ? 'slate' : tipoConta === 'laboratorio' ? 'blue' : 'emerald';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">

            {/* === FUNDO === */}
            <div className="absolute inset-0 -z-20 bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-40"></div>
            <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[800px] h-[800px] bg-emerald-400/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply"></div>

            <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-700 relative z-10">

                {/* CABEÇALHO WIZARD */}
                <div className="mb-10 text-center relative">
                    {step > 0 && !tokenURL && (
                        <button onClick={() => setStep(step - 1)} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition hover:shadow-sm">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}

                    <Link to="/" className="inline-flex items-center justify-center h-20 mb-6 hover:scale-105 transition-transform">
                        <img src="/logo.png" alt="EloLab Systems" className="h-full w-auto object-contain drop-shadow-md" />
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">
                        {step === 0 ? 'Criar Conta' : step === 1 ? 'Dados de Acesso' : 'Detalhes da Empresa'}
                    </h1>

                    {/* Indicador de Passos */}
                    {step > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? `bg-${themeColor}-500` : 'bg-slate-200'}`}></div>
                            <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? `bg-${themeColor}-500` : 'bg-slate-200'}`}></div>
                        </div>
                    )}
                </div>

                {/* CARTÃO PRINCIPAL */}
                <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-300/50 border border-white relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500 bg-${themeColor}-500`}></div>

                    {/* PASSO 0: ESCOLHER O TIPO */}
                    {step === 0 && !tokenURL && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2 text-center">Selecione o seu perfil</h3>

                            <button onClick={() => { setTipoConta('laboratorio'); setStep(1); }} className="w-full flex items-center justify-between p-6 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left shadow-sm hover:shadow-lg hover:shadow-blue-500/10">
                                <div className="flex items-center gap-5">
                                    <div className="flex h-16 w-16 items-center justify-center bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-100 group-hover:border-blue-500">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xl mb-1">Laboratório</h3>
                                        <p className="text-sm text-slate-500 font-medium">Receber pedidos e gerir produção.</p>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                                </div>
                            </button>

                            <button onClick={() => { setTipoConta('clinica'); setStep(1); }} className="w-full flex items-center justify-between p-6 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group text-left shadow-sm hover:shadow-lg hover:shadow-emerald-500/10">
                                <div className="flex items-center gap-5">
                                    <div className="flex h-16 w-16 items-center justify-center bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all border border-emerald-100 group-hover:border-emerald-500">
                                        <Smile className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xl mb-1">Clínica</h3>
                                        <p className="text-sm text-slate-500 font-medium">Enviar trabalhos para laboratórios.</p>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* PASSO 1: DADOS DE ACESSO */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">O Seu Nome *</label>
                                <div className="relative group">
                                    <User className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-${themeColor}-600`} />
                                    <input autoFocus required type="text" value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 outline-none transition-all focus:bg-white focus:ring-4 focus:border-${themeColor}-600 focus:ring-${themeColor}-600/10`} placeholder="Ex: Dr. João Silva" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">Email Profissional *</label>
                                <div className="relative group">
                                    <Mail className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-${themeColor}-600`} />
                                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 outline-none transition-all focus:bg-white focus:ring-4 focus:border-${themeColor}-600 focus:ring-${themeColor}-600/10`} placeholder="seu@email.com" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">Criar uma Senha Segura *</label>
                                <div className="relative group mb-3">
                                    <Lock className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-${themeColor}-600`} />
                                    <input required type="password" value={senha} onChange={e => setSenha(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 outline-none transition-all focus:bg-white focus:ring-4 focus:border-${themeColor}-600 focus:ring-${themeColor}-600/10`} placeholder="Mínimo 8 caracteres" />
                                </div>

                                {/* Verificador de Senha Visual */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        {isLengthValid ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-slate-300" />}
                                        <span className={isLengthValid ? "text-emerald-700" : "text-slate-500"}>Mínimo de 8 caracteres</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        {hasLetter ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-slate-300" />}
                                        <span className={hasLetter ? "text-emerald-700" : "text-slate-500"}>Pelo menos uma letra</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        {hasNumber ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-slate-300" />}
                                        <span className={hasNumber ? "text-emerald-700" : "text-slate-500"}>Pelo menos um número</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={!nomeResponsavel || !email || !isPasswordValid}
                                onClick={() => setStep(2)}
                                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 bg-${themeColor}-600 hover:bg-${themeColor}-700 shadow-${themeColor}-500/30`}
                            >
                                Continuar <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {/* PASSO 2: EMPRESA E MORADA */}
                    {step === 2 && (
                        <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-right-8 duration-300">

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">Nome d{tipoConta === 'laboratorio' ? 'o Laboratório' : 'a Clínica'} *</label>
                                <div className="relative group">
                                    <Building2 className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-${themeColor}-600`} />
                                    <input autoFocus required type="text" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 outline-none transition-all focus:bg-white focus:ring-4 focus:border-${themeColor}-600 focus:ring-${themeColor}-600/10`} placeholder="Ex: Sorriso Mágico" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Telefone com DDI */}
                                <div className="col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Telefone *</label>
                                    <div className={`flex rounded-xl border border-slate-200 bg-slate-50/50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:border-${themeColor}-600 focus-within:ring-${themeColor}-600/10 overflow-hidden`}>
                                        <div className="flex items-center border-r border-slate-200 bg-slate-100/50 px-2">
                                            <Globe className="h-4 w-4 text-slate-400 mr-1" />
                                            <select
                                                value={countryCode}
                                                onChange={e => setCountryCode(e.target.value)}
                                                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer py-3.5"
                                            >
                                                {COUNTRY_CODES.map(c => (
                                                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input required type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full bg-transparent py-3.5 px-4 outline-none font-medium" placeholder="Ex: 912 345 678" />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">NIF (Número de Identificação) *</label>
                                    <div className="relative group">
                                        <FileText className={`absolute top-3.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-${themeColor}-600`} />
                                        <input required type="text" value={nif} onChange={e => setNif(e.target.value)} className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 outline-none transition-all focus:bg-white focus:ring-4 focus:border-${themeColor}-600 focus:ring-${themeColor}-600/10`} placeholder="Ex: 501234567" />
                                    </div>
                                </div>

                                {/* MORADA COM AUTOCOMPLETE */}
                                <div className="col-span-2 border-t border-slate-100 pt-6 mt-2">
                                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <MapPin className={`h-4 w-4 text-${themeColor}-500`} /> Morada da Empresa
                                    </label>
                                    <p className="text-xs text-slate-500 mb-4">Comece a escrever para procurar automaticamente.</p>

                                    <div className="space-y-4">
                                        <input
                                            ref={autocompleteInputRef}
                                            type="text"
                                            value={moradaBusca}
                                            onChange={e => setMoradaBusca(e.target.value)}
                                            className={`w-full rounded-xl border border-slate-200 bg-white py-3.5 px-4 outline-none transition-all focus:ring-4 focus:border-${themeColor}-600 focus:ring-${themeColor}-600/10 shadow-sm`}
                                            placeholder="Ex: Rua de Santa Catarina, Porto"
                                        />

                                        {/* Campos Ocultos/Visíveis para confirmar a morada preenchida */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm outline-none" required />
                                            <input type="text" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} placeholder="Código Postal" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm outline-none" required />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || !nomeEmpresa || !telefone || !nif || !cidade} className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 bg-${themeColor}-600 hover:bg-${themeColor}-700 shadow-${themeColor}-500/30`}>
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> Finalizar Registo</>}
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center relative z-10 bg-white/60 backdrop-blur-sm py-4 px-6 rounded-2xl border border-white shadow-sm inline-block mx-auto">
                    <p className="text-slate-600 font-medium">
                        Já tem conta?{' '}
                        <Link to="/login" className={`font-bold text-slate-900 hover:text-${themeColor}-600 hover:underline transition-colors`}>
                            Faça login aqui
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}