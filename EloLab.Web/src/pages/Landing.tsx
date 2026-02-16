import { Link } from 'react-router-dom';
import {
    ArrowRight, Building2, Smile, CheckCircle2, Star,
    LayoutDashboard, Users, ScrollText, PlusCircle,
    Upload, Palette, Search, Link as LinkIcon
} from 'lucide-react';

export function Landing() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900 overflow-hidden relative">

            {/* === DECORAÇÃO DE FUNDO GLOBAL === */}
            <div className="absolute inset-0 -z-20 h-full w-full bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-50"></div>
            <div className="absolute top-0 left-1/2 -z-10 h-[800px] w-[1000px] -translate-x-1/2 opacity-60 mix-blend-multiply blur-[120px] bg-gradient-to-tr from-blue-200 to-indigo-100 pointer-events-none"></div>

            {/* === NAVBAR === */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl transition-all shadow-sm">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center">
                        {/* Aumentámos a imagem (h-12) e removemos o <span> com o texto */}
                        <img src="/logo.png" alt="EloLab Systems" className="h-12 w-auto object-contain" />
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="hidden font-semibold text-slate-600 transition hover:text-blue-600 sm:block">
                            Fazer Login
                        </Link>
                        <Link to="/registro" className="group flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/30 active:translate-y-0">
                            Criar Conta
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* === HERO SECTION === */}
            <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24">
                <div className="mx-auto max-w-7xl px-6 text-center relative z-10">
                    <div className="animate-in slide-in-from-bottom-8 duration-700 fade-in">
                        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm">
                            <Star className="h-4 w-4 fill-blue-500 text-blue-500" />
                            Gestão inteligente para o setor dentário
                        </div>
                        <h1 className="mx-auto max-w-5xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
                            O seu laboratório num <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">ecossistema digital</span>
                        </h1>
                        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                            Elimine prescrições em papel e chamadas intermináveis. Centralize trabalhos, clínicas parceiras e tabelas de preços numa única plataforma.
                        </p>
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-in slide-in-from-bottom-8 duration-700 delay-150 fade-in fill-mode-backwards">
                        <Link to="/registro" className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 sm:w-auto ring-4 ring-blue-600/20">
                            Começar Agora <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link to="/login" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200/60 bg-white/80 backdrop-blur-md px-8 py-4 text-base font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-white hover:shadow-md sm:w-auto shadow-sm">
                            Explorar Plataforma
                        </Link>
                    </div>
                </div>
            </section>

            {/* === SPLIT CTA (Laboratório / Clínica) MOVIDO PARA CIMA === */}
            <section className="py-12 sm:py-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 relative z-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-0 overflow-hidden rounded-[3rem] bg-slate-900 md:grid-cols-2 shadow-2xl relative border border-slate-800">
                        {/* Textura no fundo do bloco escuro */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                        <div className="absolute top-0 right-1/2 -m-32 h-64 w-64 rounded-full bg-blue-500/30 blur-[100px]"></div>
                        <div className="absolute bottom-0 left-1/2 -m-32 h-64 w-64 rounded-full bg-emerald-500/30 blur-[100px]"></div>

                        {/* Laboratório Side */}
                        <div className="relative p-12 md:p-16 lg:p-20 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                            <div className="relative z-10">
                                <div className="mb-8 inline-flex rounded-2xl bg-slate-800/80 backdrop-blur-sm p-4 ring-1 ring-white/10 shadow-xl">
                                    <Building2 className="h-10 w-10 text-blue-400" />
                                </div>
                                <h3 className="mb-4 text-4xl font-bold text-white tracking-tight drop-shadow-md">Sou Laboratório</h3>
                                <p className="mb-8 text-lg text-slate-400">Modernize a sua operação, receba pedidos perfeitamente formatados e centralize a sua gestão.</p>
                                <ul className="mb-10 space-y-4 text-slate-300">
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0" /> Organize todos os trabalhos</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0" /> Link mágico para convidar clínicas</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0" /> Faturação e controlo financeiro</li>
                                </ul>
                                <Link to="/registro" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 w-full justify-center sm:w-auto border border-blue-500/50">
                                    Criar conta de Laboratório <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Clínica Side */}
                        <div className="relative border-t border-slate-800 p-12 md:border-t-0 md:border-l md:p-16 lg:p-20 group bg-slate-800/20">
                            <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                            <div className="relative z-10">
                                <div className="mb-8 inline-flex rounded-2xl bg-slate-800/80 backdrop-blur-sm p-4 ring-1 ring-white/10 shadow-xl">
                                    <Smile className="h-10 w-10 text-emerald-400" />
                                </div>
                                <h3 className="mb-4 text-4xl font-bold text-white tracking-tight drop-shadow-md">Sou Clínica</h3>
                                <p className="mb-8 text-lg text-slate-400">Conecte-se aos melhores laboratórios, envie prescrições detalhadas e nunca mais perca um prazo.</p>
                                <ul className="mb-10 space-y-4 text-slate-300">
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Envio de pedidos simplificado</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Acompanhamento de status online</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Arquivo digital seguro do paciente</li>
                                </ul>
                                <Link to="/registro" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 w-full justify-center sm:w-auto border border-emerald-500/50">
                                    Criar conta de Clínica <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === TOUR PELA PLATAFORMA (Z-PATTERN) === */}
            <section className="relative py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 space-y-32">

                    <div className="text-center mb-24">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl drop-shadow-sm">Tudo o que precisa para crescer</h2>
                        <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">Desenhado por especialistas para eliminar atritos diários e proporcionar uma experiência premium.</p>
                    </div>

                    {/* FEATURE 1: Dashboard & Novo Pedido */}
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-2">
                                <LayoutDashboard className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Controlo total numa única visão
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                O seu Dashboard organiza tudo. Acompanhe os trabalhos que estão a entrar, os que estão em produção e os atrasos. Criar um <strong className="text-slate-900">Novo Pedido</strong> é tão simples como preencher um formulário digital inteligente, sem letras ilegíveis.
                            </p>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Prescrições digitais detalhadas</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Histórico completo por paciente</li>
                            </ul>
                        </div>
                        {/* Mockup */}
                        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
                            <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full -z-10"></div>
                            <div className="rounded-[2rem] border border-white/60 bg-white/60 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50">
                                    <h3 className="font-bold text-slate-900">Novo Trabalho</h3>
                                    <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"><PlusCircle className="h-3 w-3" /> Salvar</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-20 bg-slate-200 rounded-full"></div>
                                            <div className="h-10 w-full bg-white border border-slate-100 rounded-xl flex items-center px-3 shadow-sm"><span className="text-sm text-slate-400">Nome do Paciente...</span></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <div className="h-3 w-24 bg-slate-200 rounded-full mb-4"></div>
                                        {/* Odontograma Falso */}
                                        <div className="flex justify-center gap-1 mb-2">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className={`h-8 w-6 rounded-md border ${i === 2 ? 'bg-blue-100 border-blue-300' : 'bg-white border-slate-200'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <div className="h-8 w-24 bg-blue-50 border border-blue-200 rounded-lg"></div>
                                        <div className="h-8 w-20 bg-slate-100 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FEATURE 2: Minhas Clínicas & Notificações */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-2 relative">
                                <Users className="h-6 w-6" />
                                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white border-2 border-emerald-50">3</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Convites mágicos e notificações
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                A sua rede de parceiros a um clique de distância. Vá a <strong className="text-slate-900">Minhas Clínicas</strong>, gere um link mágico e convide dentistas para o seu laboratório. Sempre que enviarem um pedido, o nosso sistema de <strong className="text-slate-900">Notificações Inteligentes</strong> avisa-o instantaneamente.
                            </p>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Links de convite seguros e únicos</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Alertas de novos pedidos em tempo real</li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
                            <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full -z-10"></div>
                            <div className="rounded-[2rem] border border-white/60 bg-white/60 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="relative w-48">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <div className="h-9 w-full bg-white border border-slate-200 rounded-lg"></div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-700 text-xs font-bold shadow-sm">
                                        <LinkIcon className="h-3 w-3" /> Copiar Link de Convite
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">SM</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">Sorriso Mágico Clínica</div>
                                                <div className="text-[10px] text-slate-500">dr.joao@sorrisomagico.pt</div>
                                            </div>
                                        </div>
                                        <div className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-[10px] font-bold">Com Acesso</div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">DP</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">Dental Premium</div>
                                                <div className="text-[10px] text-slate-500">+351 912 345 678</div>
                                            </div>
                                        </div>
                                        <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold">Manual</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FEATURE 3: Tabelas de Preços */}
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 mb-2">
                                <ScrollText className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Tabelas de preços exclusivas
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Diferentes clínicas exigem diferentes acordos. Na área de <strong className="text-slate-900">Serviços e Preços</strong>, pode criar o seu catálogo geral, e nas <strong className="text-slate-900">Tabelas de Preços</strong> pode definir descontos ou tabelas exclusivas que são aplicadas automaticamente quando uma clínica parceira envia um pedido.
                            </p>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Faturação automatizada sem surpresas</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-purple-500" /> Preços ocultos de clínicas concorrentes</li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
                            <div className="absolute inset-0 bg-purple-400/20 blur-3xl rounded-full -z-10"></div>
                            <div className="rounded-[2rem] border border-white/60 bg-white/60 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
                                <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                        <ScrollText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase">A editar tabela</div>
                                        <div className="text-sm font-bold text-slate-900">Tabela VIP Parceiros (15% Desc)</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200/50">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Serviço</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">Preço Base → Final</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                        <span className="text-sm font-bold text-slate-800">Coroa E-Max</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 line-through">100€</span>
                                            <span className="text-sm font-bold text-purple-600">85€</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                        <span className="text-sm font-bold text-slate-800">Prótese Acrílica Total</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 line-through">200€</span>
                                            <span className="text-sm font-bold text-purple-600">170€</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FEATURE 4: Personalização White Label */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-2">
                                <Palette className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                A plataforma tem a sua cara
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                No EloLab, o laboratório é a estrela. Vá ao <strong className="text-slate-900">Meu Perfil</strong> e personalize a experiência. Faça upload do seu Logótipo e escolha a Cor da sua marca. Quando as clínicas fizerem login no seu portal, vão ver as suas cores, transmitindo uma imagem altamente profissional.
                            </p>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-amber-500" /> Logótipo personalizado no menu lateral</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-amber-500" /> Cores dinâmicas adaptadas à sua marca</li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
                            <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full -z-10"></div>
                            <div className="rounded-[2rem] border border-white/60 bg-white/60 backdrop-blur-xl shadow-2xl p-6 overflow-hidden flex gap-6">
                                <div className="w-48 bg-gradient-to-b from-indigo-600/10 to-white border-r border-indigo-600/20 rounded-xl p-4 hidden sm:block">
                                    <div className="flex justify-center mb-6 pb-6 border-b border-indigo-200/50">
                                        <div className="h-12 w-32 bg-indigo-600 text-white font-black text-lg rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                            MEU LAB
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 p-2 bg-indigo-600/15 text-indigo-700 border-r-2 border-indigo-600 rounded-lg font-bold text-xs"><LayoutDashboard className="h-3 w-3" /> Dashboard</div>
                                        <div className="flex items-center gap-2 p-2 text-slate-500 font-medium text-xs"><Users className="h-3 w-3" /> Minhas Clínicas</div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-3">Logótipo da Empresa</div>
                                        <div className="h-24 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 transition-colors cursor-pointer">
                                            <Upload className="h-5 w-5 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500">Fazer upload de imagem</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-3">Cor Primária</div>
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-600 shadow-sm border-2 border-white ring-2 ring-slate-200 cursor-pointer"></div>
                                            <div className="h-8 w-8 rounded-full bg-indigo-600 shadow-sm border-2 border-white ring-2 ring-indigo-600 cursor-pointer"></div>
                                            <div className="h-8 w-8 rounded-full bg-emerald-600 shadow-sm border-2 border-white ring-2 ring-transparent cursor-pointer"></div>
                                            <div className="h-8 w-8 rounded-full bg-slate-900 shadow-sm border-2 border-white ring-2 ring-transparent cursor-pointer"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* === SMALL FOOTER CTA === */}
            <section className="py-16 sm:py-24 relative border-t border-slate-200/60 bg-white/30 backdrop-blur-sm">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 sm:text-4xl mb-6 tracking-tight">Pronto para dar o próximo passo?</h2>
                    <p className="text-slate-500 text-lg mb-8">Junte-se a dezenas de laboratórios que já comunicam de forma digital e sem erros.</p>
                    <Link to="/registro" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold text-white transition hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20">
                        Criar a sua conta agora <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* === FOOTER === */}
            <footer className="bg-white/50 py-8 text-center text-sm text-slate-500">
                <div className="flex items-center justify-center mb-4">
                    {/* Aumentámos a imagem (h-10) e removemos o <span> */}
                    <img src="/logo.png" alt="EloLab Systems" className="h-10 w-auto object-contain opacity-75 grayscale hover:grayscale-0 transition-all" />
                </div>
                <p>&copy; {new Date().getFullYear()} EloLab Systems. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}