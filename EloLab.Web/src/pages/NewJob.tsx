import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Calendar, User, FileText, Building2, Palette, ChevronDown } from 'lucide-react';
import type { UserSession, Servico } from '../types';

export function NewJob() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserSession | null>(null);

    // Listas para os Dropdowns
    const [listaServicos, setListaServicos] = useState<Servico[]>([]);
    const [listaClinicas, setListaClinicas] = useState<any[]>([]); // <--- Adicionado

    // Estados do Formulário
    const [paciente, setPaciente] = useState('');
    const [dentes, setDentes] = useState('');
    const [cor, setCor] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [obs, setObs] = useState('');
    const [clinicaId, setClinicaId] = useState('');

    const [servicoId, setServicoId] = useState('');
    const [valor, setValor] = useState('');

    useEffect(() => {
        // 1. Pega dados do usuário
        api.get('/Auth/me').then(res => setUser(res.data));

        // 2. Pega lista de serviços
        api.get('/Servicos')
            .then(res => setListaServicos(res.data))
            .catch(() => console.log('Sem serviços cadastrados'));

        // 3. Pega lista de clínicas (NOVO)
        api.get('/Clinicas')
            .then(res => setListaClinicas(res.data))
            .catch(() => console.log('Erro ao buscar clínicas'));
    }, []);

    // Quando escolhe um serviço, atualiza o preço automaticamente
    function handleServicoChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const novoId = e.target.value;
        setServicoId(novoId);

        const servicoSelecionado = listaServicos.find(s => s.id === novoId);
        if (servicoSelecionado) {
            setValor(servicoSelecionado.precoBase.toString());
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        try {
            const payload = {
                laboratorioId: user.meusDados.id,
                clinicaId: clinicaId,
                servicoId: servicoId || null,
                pacienteNome: paciente,
                dentes: dentes,
                corDente: cor,
                dataEntrega: new Date(dataEntrega).toISOString(),
                valorPersonalizado: valor ? parseFloat(valor) : null,
                observacoes: obs
            };

            await api.post('/Trabalhos', payload);
            alert('✅ Trabalho criado com sucesso!');
            navigate('/dashboard');

        } catch (error) {
            console.error(error);
            alert('Erro ao criar trabalho.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-2xl">

                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
                </button>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8 border-b border-slate-100 pb-4">
                        <h1 className="text-2xl font-bold text-slate-900">Novo Pedido</h1>
                        <p className="text-slate-500">Preencha os dados técnicos da produção.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Seção 1: Dados do Paciente */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do Paciente</label>
                                <div className="relative">
                                    <User className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                    <input
                                        required
                                        type="text"
                                        value={paciente}
                                        onChange={e => setPaciente(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Ex: Maria Silva"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Dentes / Região</label>
                                <input
                                    type="text"
                                    value={dentes}
                                    onChange={e => setDentes(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 py-2.5 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Ex: 11, 21"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cor (Escala)</label>
                                <div className="relative">
                                    <Palette className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={cor}
                                        onChange={e => setCor(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Ex: A2, BL3"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Data de Entrega</label>
                                <div className="relative">
                                    <Calendar className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
                                    <input
                                        required
                                        type="datetime-local"
                                        value={dataEntrega}
                                        onChange={e => setDataEntrega(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Dados do Pedido */}
                        <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                            <h3 className="mb-3 text-sm font-bold text-blue-800 flex items-center gap-2">
                                <Building2 className="h-4 w-4"/> Dados Financeiros
                            </h3>
                            <div className="grid grid-cols-1 gap-4">

                                {/* DROPDOWN DE CLÍNICAS (Substituiu o Input de texto) */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-blue-800">Clínica Parceira</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={clinicaId}
                                            onChange={e => setClinicaId(e.target.value)}
                                            className="w-full appearance-none rounded border border-blue-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500"
                                        >
                                            <option value="">Selecione a Clínica...</option>
                                            {listaClinicas.map((clinica: any) => (
                                                <option key={clinica.id} value={clinica.id}>
                                                    {clinica.nome}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-blue-400" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* DROPDOWN DE SERVIÇOS */}
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-blue-800">Serviço (Tabela)</label>
                                        <div className="relative">
                                            <select
                                                value={servicoId}
                                                onChange={handleServicoChange}
                                                className="w-full appearance-none rounded border border-blue-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500"
                                            >
                                                <option value="">Selecione...</option>
                                                {listaServicos.map(servico => (
                                                    <option key={servico.id} value={servico.id}>
                                                        {servico.nome}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-blue-400" />
                                        </div>
                                    </div>

                                    {/* Valor (Automático ou Manual) */}
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-blue-800">Valor (€)</label>
                                        <input
                                            type="number"
                                            value={valor}
                                            onChange={e => setValor(e.target.value)}
                                            className="w-full rounded border border-blue-200 bg-white py-2 px-3 text-sm outline-none focus:border-blue-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Obs */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Observações</label>
                            <div className="relative">
                                <FileText className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                                <textarea
                                    rows={3}
                                    value={obs}
                                    onChange={e => setObs(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Criar Pedido</>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}