import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import {
    ArrowLeft, Save, Loader2, Calendar, User, FileText,
    Building2, Palette, ChevronDown, Euro, UploadCloud,
    FileBox, Image as ImageIcon, Trash2, File as FileIcon, Smile, Calculator
} from 'lucide-react';
import type { UserSession, Servico } from '../types';

// === DADOS ESTRUTURADOS PARA O ODONTOGRAMA ===
const TEETH_Q1 = ['18', '17', '16', '15', '14', '13', '12', '11'];
const TEETH_Q2 = ['21', '22', '23', '24', '25', '26', '27', '28'];
const TEETH_Q3 = ['31', '32', '33', '34', '35', '36', '37', '38'];
const TEETH_Q4 = ['48', '47', '46', '45', '44', '43', '42', '41'];

const ALL_UPPER = [...TEETH_Q1, ...TEETH_Q2];
const ALL_LOWER = [...TEETH_Q4, ...TEETH_Q3];

const VITA_SHADES = [
    { group: 'Bleach', colors: ['BL1', 'BL2', 'BL3', 'BL4'] },
    { group: 'A (Avermelhado)', colors: ['A1', 'A2', 'A3', 'A3.5', 'A4'] },
    { group: 'B (Amarelado)', colors: ['B1', 'B2', 'B3', 'B4'] },
    { group: 'C (Acinzentado)', colors: ['C1', 'C2', 'C3', 'C4'] },
    { group: 'D (Avermelhado-Cinza)', colors: ['D2', 'D3', 'D4'] },
];

export function NewJob() {
    const navigate = useNavigate();
    const location = useLocation();

    // Recupera dados passados pela navegação
    const preSelectedLabId = location.state?.preSelectedLabId;
    const preSelectedLabColor = location.state?.preSelectedLabColor;
    const preSelectedServiceId = location.state?.preSelectedServiceId; // <--- NOVO: ID do Serviço vindo do Catálogo

    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserSession | null>(null);

    // Cor Dinâmica
    const [dynamicPrimaryColor, setDynamicPrimaryColor] = useState(
        preSelectedLabColor || localStorage.getItem('elolab_user_color') || '#2563EB'
    );

    const [listaServicos, setListaServicos] = useState<Servico[]>([]);
    const [listaParceiros, setListaParceiros] = useState<any[]>([]);

    // Estados do Formulário
    const [parceiroSelecionadoId, setParceiroSelecionadoId] = useState(preSelectedLabId || '');
    const [paciente, setPaciente] = useState('');

    // Inicia com o serviço pré-selecionado (se houver)
    const [servicoId, setServicoId] = useState(preSelectedServiceId || '');

    // Dentes
    const [dentesSelecionados, setDentesSelecionados] = useState<string[]>([]);
    const [dentesString, setDentesString] = useState('');

    // Preços
    const [valorUnitario, setValorUnitario] = useState<string>('');
    const [valorTotal, setValorTotal] = useState<string>('');

    const [cor, setCor] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [obs, setObs] = useState('');
    const [arquivos, setArquivos] = useState<File[]>([]);

    // === VARIÁVEIS AUXILIARES ===
    const isLab = user?.tipo === 'Laboratorio';
    const isPreSelectedMode = !!preSelectedLabId && !isLab;

    useEffect(() => {
        carregarDadosIniciais();
    }, []);

    // Lógica de Cor "Camaleão"
    useEffect(() => {
        if (isLab) {
            setDynamicPrimaryColor(localStorage.getItem('elolab_user_color') || '#2563EB');
        } else if (parceiroSelecionadoId && listaParceiros.length > 0) {
            const parceiro = listaParceiros.find(p => p.id === parceiroSelecionadoId);
            if (parceiro?.corPrimaria) {
                setDynamicPrimaryColor(parceiro.corPrimaria);
            }
        }
    }, [isLab, parceiroSelecionadoId, listaParceiros]);

    // Carregar serviços quando seleciona parceiro
    useEffect(() => {
        if (!user) return;

        // Se NÃO sou Lab (sou Clínica) e tenho um parceiro selecionado
        if (!isLab && parceiroSelecionadoId) {
            // Se NÃO veio pré-selecionado do catálogo, limpamos para garantir.
            // Se veio, mantemos para a lógica de auto-preenchimento funcionar.
            if (!preSelectedServiceId && !listaServicos.length) setListaServicos([]);

            // CORREÇÃO: Chama o endpoint específico que lista serviços daquele Lab
            api.get(`/Servicos/laboratorio/${parceiroSelecionadoId}`)
                .then(res => {
                    setListaServicos(res.data);
                })
                .catch(err => console.error("Erro ao carregar serviços do lab:", err));
        }
    }, [parceiroSelecionadoId, user, isLab]);

    // === NOVO: LÓGICA PARA PREENCHER PREÇO AUTOMATICAMENTE ===
    // Se vier do catálogo, assim que a lista carregar, preenche o preço
    useEffect(() => {
        if (preSelectedServiceId && listaServicos.length > 0) {
            const servicoEncontrado = listaServicos.find(s => s.id === preSelectedServiceId);
            if (servicoEncontrado) {
                setValorUnitario(servicoEncontrado.precoBase.toString());
                setServicoId(preSelectedServiceId); // Garante a seleção no select
            }
        }
    }, [listaServicos, preSelectedServiceId]);

    // Lógica de Strings dos Dentes
    useEffect(() => {
        if (dentesSelecionados.length === 0) {
            setDentesString('');
            return;
        }
        const isAllUpper = ALL_UPPER.every(t => dentesSelecionados.includes(t));
        const isAllLower = ALL_LOWER.every(t => dentesSelecionados.includes(t));

        if (isAllUpper && isAllLower) {
            setDentesString("Boca Completa");
        } else if (isAllUpper) {
            const extraLower = dentesSelecionados.filter(t => !ALL_UPPER.includes(t));
            if (extraLower.length > 0) setDentesString(`Superior + ${extraLower.join(', ')}`);
            else setDentesString("Superior");
        } else if (isAllLower) {
            const extraUpper = dentesSelecionados.filter(t => !ALL_LOWER.includes(t));
            if (extraUpper.length > 0) setDentesString(`Inferior + ${extraUpper.join(', ')}`);
            else setDentesString("Inferior");
        } else {
            setDentesString(dentesSelecionados.join(', '));
        }
    }, [dentesSelecionados]);

    // Cálculo do Total
    useEffect(() => {
        calcularValorTotal();
    }, [dentesString, valorUnitario, dentesSelecionados]);

    function calcularValorTotal() {
        if (!valorUnitario) {
            setValorTotal('');
            return;
        }
        const unitario = parseFloat(valorUnitario);
        if (isNaN(unitario)) return;

        let quantidade = 0;
        if (dentesString === 'Superior' || dentesString === 'Inferior') {
            quantidade = 1;
        } else if (dentesString === 'Boca Completa') {
            quantidade = 2;
        } else {
            quantidade = dentesSelecionados.length;
        }

        if (quantidade === 0) {
            setValorTotal('');
            return;
        }
        const total = unitario * quantidade;
        setValorTotal(total.toFixed(2));
    }

    async function carregarDadosIniciais() {
        try {
            const resUser = await api.get('/Auth/me');
            setUser(resUser.data);
            const isUsuarioLab = resUser.data.tipo === 'Laboratorio';

            if (isUsuarioLab) {
                // Se for lab, carrega os seus próprios serviços
                api.get('/Servicos').then(res => setListaServicos(res.data));
                const res = await api.get('/Clinicas');
                setListaParceiros(res.data);
            } else {
                const res = await api.get('/Laboratorios');
                setListaParceiros(res.data);
            }
        } catch (error) {
            navigate('/dashboard');
        }
    }

    function handleServicoChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const novoId = e.target.value;
        setServicoId(novoId);
        const servicoSelecionado = listaServicos.find(s => s.id === novoId);
        if (servicoSelecionado) {
            setValorUnitario(servicoSelecionado.precoBase.toString());
        } else {
            setValorUnitario('');
            setValorTotal('');
        }
    }

    const handleBack = () => {
        if (isLab) {
            navigate('/dashboard');
        } else if (preSelectedLabId) {
            navigate(`/portal/${preSelectedLabId}`);
        } else {
            navigate('/parceiros');
        }
    };

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) setArquivos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    function removeFile(index: number) {
        setArquivos(prev => prev.filter((_, i) => i !== index));
    }
    function getFileIcon(fileName: string) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <ImageIcon className="h-5 w-5" style={{ color: dynamicPrimaryColor }} />;
        if (['stl', 'obj', 'ply'].includes(ext || '')) return <FileBox className="h-5 w-5" style={{ color: dynamicPrimaryColor }} />;
        return <FileIcon className="h-5 w-5 text-slate-400" />;
    }
    const toggleDente = (dente: string) => {
        setDentesSelecionados(prev =>
            prev.includes(dente) ? prev.filter(d => d !== dente) : [...prev, dente].sort()
        );
    };
    const selecionarArco = (tipo: 'superior' | 'inferior' | 'limpar') => {
        if (tipo === 'limpar') {
            setDentesSelecionados([]);
        } else if (tipo === 'superior') {
            const allSelected = ALL_UPPER.every(d => dentesSelecionados.includes(d));
            if (allSelected) setDentesSelecionados(prev => prev.filter(d => !ALL_UPPER.includes(d)));
            else setDentesSelecionados(prev => [...new Set([...prev, ...ALL_UPPER])].sort());
        } else if (tipo === 'inferior') {
            const allSelected = ALL_LOWER.every(d => dentesSelecionados.includes(d));
            if(allSelected) setDentesSelecionados(prev => prev.filter(d => !ALL_LOWER.includes(d)));
            else setDentesSelecionados(prev => [...new Set([...prev, ...ALL_LOWER])].sort());
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            const payload = {
                laboratorioId: isLab ? user.meusDados.id : parceiroSelecionadoId,
                clinicaId: isLab ? parceiroSelecionadoId : user.meusDados.id,
                servicoId: servicoId || null,
                pacienteNome: paciente,
                dentes: dentesString,
                corDente: cor,
                dataEntrega: new Date(dataEntrega).toISOString(),
                valorPersonalizado: valorTotal ? parseFloat(valorTotal) : 0,
                descricaoPersonalizada: obs
            };
            const response = await api.post('/Trabalhos', payload);
            const trabalhoId = response.data.id;

            if (arquivos.length > 0 && trabalhoId) {
                for (const arquivo of arquivos) {
                    const formData = new FormData();
                    formData.append('arquivo', arquivo);
                    await api.post(`/Trabalhos/${trabalhoId}/anexo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                }
            }
            alert('✅ Pedido criado com sucesso!');

            if (!isLab && preSelectedLabId) {
                navigate(`/portal/${preSelectedLabId}`);
            } else if (!isLab) {
                navigate('/parceiros');
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            alert('Erro ao criar trabalho.');
        } finally {
            setLoading(false);
        }
    }

    const DenteBtn = ({ id }: { id: string }) => {
        const selected = dentesSelecionados.includes(id);
        return (
            <button
                type="button"
                onClick={() => toggleDente(id)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                    selected
                        ? 'text-white shadow-md scale-110'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={selected ? { backgroundColor: dynamicPrimaryColor, borderColor: dynamicPrimaryColor } : {}}
            >
                {id}
            </button>
        );
    };

    return (
        <PageContainer primaryColor={dynamicPrimaryColor}>

            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <button onClick={handleBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
                        <ArrowLeft className="h-4 w-4" /> Cancelar
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 border-b border-slate-100 pb-6">
                        <h1 className="text-3xl font-bold text-slate-900">Novo Pedido</h1>
                        <p className="text-slate-500 mt-1">
                            {isPreSelectedMode
                                ? 'A criar pedido para o laboratório parceiro.'
                                : 'Preencha os dados abaixo para iniciar um novo trabalho.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Dados Iniciais */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold text-slate-700">Nome do Paciente</label>
                                <div className="relative">
                                    <User className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                    <input required type="text" value={paciente} onChange={e => setPaciente(e.target.value)}
                                           className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 font-medium outline-none focus:bg-white transition"
                                           onFocus={(e) => e.target.style.borderColor = dynamicPrimaryColor}
                                           onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                           placeholder="Ex: Maria Silva" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-bold" style={{ color: dynamicPrimaryColor }}>
                                    {isLab ? "Clínica (Cliente)" : "Laboratório (Parceiro)"}
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute top-3 left-3 h-5 w-5" style={{ color: dynamicPrimaryColor }} />

                                    {/* SELETOR COM TRAVA DE SEGURANÇA */}
                                    <select
                                        required
                                        value={parceiroSelecionadoId}
                                        onChange={e => setParceiroSelecionadoId(e.target.value)}
                                        disabled={isPreSelectedMode}
                                        className={`w-full appearance-none rounded-xl border py-3 pl-10 pr-8 text-sm font-bold outline-none transition
                                            ${isPreSelectedMode ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                        style={{ borderColor: `${dynamicPrimaryColor}40`, backgroundColor: `${dynamicPrimaryColor}08`, color: dynamicPrimaryColor }}
                                    >
                                        <option value="">{isLab ? "Selecione a Clínica..." : "Selecione o Laboratório..."}</option>
                                        {listaParceiros.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>

                                    {!isPreSelectedMode && (
                                        <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4" style={{ color: dynamicPrimaryColor }} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ficha Técnica */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                            <h3 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                <FileText className="h-4 w-4"/> Ficha Técnica
                            </h3>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Serviço</label>
                                    <div className="relative">
                                        <select value={servicoId} onChange={handleServicoChange} disabled={!parceiroSelecionadoId && !isLab}
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-8 text-sm font-medium outline-none transition cursor-pointer disabled:opacity-50"
                                                onFocus={(e) => e.target.style.borderColor = dynamicPrimaryColor}
                                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}>
                                            <option value="">Selecione o serviço...</option>
                                            {listaServicos.map(s => <option key={s.id} value={s.id}>{s.nome} - {s.material} ({new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.precoBase)})</option>)}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>

                                {/* ODONTOGRAMA */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-bold text-slate-700">Seleção de Dentes</label>
                                        <div className="flex gap-2 text-xs font-bold">
                                            <button type="button" onClick={() => selecionarArco('superior')} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Superior</button>
                                            <button type="button" onClick={() => selecionarArco('inferior')} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Inferior</button>
                                            <button type="button" onClick={() => selecionarArco('limpar')} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition">Limpar</button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-100/50 p-6 flex flex-col items-center gap-6">
                                        <div className="flex gap-1">
                                            <div className="flex gap-1">{TEETH_Q1.map(id => <DenteBtn key={id} id={id} />)}</div>
                                            <div className="w-0.5 bg-slate-300 mx-2 h-8 self-center opacity-50"></div>
                                            <div className="flex gap-1">{TEETH_Q2.map(id => <DenteBtn key={id} id={id} />)}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="flex gap-1">{TEETH_Q4.map(id => <DenteBtn key={id} id={id} />)}</div>
                                            <div className="w-0.5 bg-slate-300 mx-2 h-8 self-center opacity-50"></div>
                                            <div className="flex gap-1">{TEETH_Q3.map(id => <DenteBtn key={id} id={id} />)}</div>
                                        </div>
                                    </div>

                                    <div className="relative mt-4">
                                        <Smile className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={dentesString}
                                            readOnly
                                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-medium outline-none transition placeholder:font-normal text-slate-500 cursor-not-allowed"
                                            placeholder="Selecione os dentes acima..."
                                        />
                                    </div>
                                </div>

                                {/* SELETOR DE COR */}
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Selecione a Cor</label>
                                    <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                        {VITA_SHADES.map((group) => (
                                            <div key={group.group} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <span className="w-32 text-xs font-bold uppercase text-slate-400">{group.group}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.colors.map((shade) => (
                                                        <button
                                                            key={shade}
                                                            type="button"
                                                            onClick={() => setCor(shade)}
                                                            className={`flex h-8 w-10 items-center justify-center rounded-lg text-sm font-bold transition border ${cor === shade ? 'text-white shadow-md transform scale-105' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                                            style={cor === shade ? { backgroundColor: dynamicPrimaryColor, borderColor: dynamicPrimaryColor } : {}}
                                                        >
                                                            {shade}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <Palette className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                        <input type="text" value={cor} onChange={e => setCor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-medium outline-none transition placeholder:font-normal" onFocus={(e) => e.target.style.borderColor = dynamicPrimaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} placeholder="Ou digite personalizado (Ex: A2 cervical, A1 incisal)" />
                                    </div>
                                </div>

                                {/* LINHA UNIFICADA: Data | Unitário | Total */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* Data */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Data de Entrega</label>
                                        <div className="relative">
                                            <Calendar className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                            <input required type="datetime-local" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-medium outline-none transition" onFocus={(e) => e.target.style.borderColor = dynamicPrimaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                                        </div>
                                    </div>

                                    {/* Unitário */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Valor Unitário (€)</label>
                                        <div className="relative">
                                            <Euro className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={valorUnitario}
                                                onChange={e => setValorUnitario(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-medium outline-none transition"
                                                onFocus={(e) => e.target.style.borderColor = dynamicPrimaryColor}
                                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-slate-700">Valor Total (€)</label>
                                        <div className="relative">
                                            <Calculator className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                            <input
                                                type="number"
                                                value={valorTotal}
                                                readOnly
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 font-bold text-slate-900 outline-none transition cursor-not-allowed"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs text-slate-400 text-right">
                                        {dentesString === 'Superior' || dentesString === 'Inferior'
                                            ? '* Arcada completa conta como 1 unidade.'
                                            : `* Calculado: ${dentesSelecionados.length > 0 ? dentesSelecionados.length : 0} elemento(s) x Unitário.`}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* Upload */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Anexos</label>
                            <div className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:bg-slate-100"
                                 style={{ borderColor: '#cbd5e1' }}
                                 onMouseEnter={(e) => e.currentTarget.style.borderColor = dynamicPrimaryColor}
                                 onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                            >
                                <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-600 transition">
                                    <UploadCloud className="mb-2 h-10 w-10" style={{ color: dynamicPrimaryColor }} />
                                    <span className="text-sm font-bold">Clique ou arraste arquivos aqui</span>
                                </div>
                                <input type="file" multiple accept=".stl,.obj,.ply,.jpg,.jpeg,.png,.pdf" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={handleFileSelect} />
                            </div>
                            {arquivos.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {arquivos.map((arq, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="rounded-lg p-2" style={{ backgroundColor: `${dynamicPrimaryColor}10` }}>
                                                    {getFileIcon(arq.name)}
                                                </div>
                                                <div className="truncate">
                                                    <p className="truncate text-sm font-bold text-slate-700">{arq.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{(arq.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeFile(index)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Obs */}
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">Observações</label>
                            <textarea rows={3} value={obs} onChange={e => setObs(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm font-medium outline-none transition" onFocus={(e) => e.target.style.borderColor = dynamicPrimaryColor} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} placeholder="Instruções específicas..." />
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 rounded-xl px-8 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-70"
                                    style={{ backgroundColor: dynamicPrimaryColor, boxShadow: `0 4px 14px ${dynamicPrimaryColor}60` }}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Confirmar Pedido</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageContainer>
    );
}