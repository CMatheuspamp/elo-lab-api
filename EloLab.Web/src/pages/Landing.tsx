import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Stethoscope, Zap, ShieldCheck, Activity, CheckCircle2, Star } from 'lucide-react';

export function Landing() {
    return (
        // Mudámos o fundo principal para um gradiente muito suave
        <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900 overflow-hidden relative">

            {/* === DECORAÇÃO DE FUNDO GLOBAL (As tais cores suaves) === */}
            <div className="absolute top-0 left-1/2 -z-10 h-[800px] w-[1000px] -translate-x-1/2 opacity-40 mix-blend-multiply blur-[120px] bg-gradient-to-tr from-blue-200 to-indigo-100 pointer-events-none"></div>
            <div className="absolute top-[40%] -right-[20%] -z-10 h-[600px] w-[600px] opacity-30 mix-blend-multiply blur-[100px] bg-gradient-to-bl from-cyan-200 to-blue-200 pointer-events-none"></div>

            {/* === NAVBAR === */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-xl transition-all">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white shadow-lg shadow-blue-500/30">
                            EL
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">EloLab</span>
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
            <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 lg:pb-40">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <div className="animate-in slide-in-from-bottom-8 duration-700 fade-in">
                        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/60 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm">
                            <Star className="h-4 w-4 fill-blue-500 text-blue-500" />
                            A plataforma nº1 em gestão de próteses
                        </div>
                        <h1 className="mx-auto max-w-5xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl md:text-7xl lg:text-8xl">
                            A ponte <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">digital</span> entre o Laboratório e a Clínica
                        </h1>
                        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                            Elimine papéis, reduza erros e acelere a produção. Um ecossistema completo para a gestão de pedidos, tabelas de preços e comunicação contínua.
                        </p>
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-in slide-in-from-bottom-8 duration-700 delay-150 fade-in fill-mode-backwards">
                        <Link to="/registro" className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 sm:w-auto ring-4 ring-blue-600/20">
                            Começar Gratuitamente <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link to="/login" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200/60 bg-white/50 backdrop-blur-md px-8 py-4 text-base font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-white hover:shadow-md sm:w-auto">
                            Acessar Plataforma
                        </Link>
                    </div>
                </div>
            </section>

            {/* === FEATURES SECTION === */}
            <section className="relative py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-20 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Tudo o que precisa para crescer</h2>
                        <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">Desenhado por especialistas para eliminar atritos diários e proporcionar uma experiência premium aos seus parceiros.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl p-8 shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
                            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-blue-50 transition-transform group-hover:scale-150" />
                            <div className="relative z-10">
                                <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 p-4 text-blue-600 ring-4 ring-white">
                                    <Zap className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-2xl font-bold text-slate-900">Pedidos Instantâneos</h3>
                                <p className="text-slate-600 leading-relaxed">As clínicas enviam trabalhos digitalmente, com fotos e prescrições claras. Chega imediatamente ao seu ecrã, sem falhas de comunicação.</p>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl p-8 shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-emerald-50 transition-transform group-hover:scale-150" />
                            <div className="relative z-10">
                                <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-4 text-emerald-600 ring-4 ring-white">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-2xl font-bold text-slate-900">Tabelas Exclusivas</h3>
                                <p className="text-slate-600 leading-relaxed">Crie tabelas de preços específicas para cada clínica parceira. Automatize a orçamentação e garanta faturação transparente.</p>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl p-8 shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
                            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-purple-50 transition-transform group-hover:scale-150" />
                            <div className="relative z-10">
                                <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 p-4 text-purple-600 ring-4 ring-white">
                                    <Activity className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-2xl font-bold text-slate-900">Rastreio em Tempo Real</h3>
                                <p className="text-slate-600 leading-relaxed">As clínicas acompanham exatamente a fase de produção (Modelagem, Acabamento, Expedido) sem precisarem de ligar para o laboratório.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === SPLIT CTA === */}
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-0 overflow-hidden rounded-[2.5rem] bg-slate-900 md:grid-cols-2 shadow-2xl relative">
                        <div className="absolute top-0 right-1/2 -m-32 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-1/2 -m-32 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"></div>

                        {/* Laboratório Side */}
                        <div className="relative p-12 md:p-16 lg:p-20 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                            <div className="relative z-10">
                                <div className="mb-8 inline-flex rounded-2xl bg-slate-800 p-4 ring-1 ring-white/10">
                                    <Building2 className="h-10 w-10 text-blue-400" />
                                </div>
                                <h3 className="mb-4 text-4xl font-bold text-white tracking-tight">Sou Laboratório</h3>
                                <p className="mb-8 text-lg text-slate-400">Modernize a sua operação, receba pedidos perfeitamente formatados e centralize a sua gestão.</p>
                                <ul className="mb-10 space-y-4 text-slate-300">
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0" /> Organize todos os trabalhos</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0" /> Link mágico para convidar clínicas</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0" /> Faturação e controlo financeiro</li>
                                </ul>
                                <Link to="/registro" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 w-full justify-center sm:w-auto">
                                    Criar conta de Laboratório <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Clínica Side */}
                        <div className="relative border-t border-slate-800 p-12 md:border-t-0 md:border-l md:p-16 lg:p-20 group bg-slate-800/20">
                            <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                            <div className="relative z-10">
                                <div className="mb-8 inline-flex rounded-2xl bg-slate-800 p-4 ring-1 ring-white/10">
                                    <Stethoscope className="h-10 w-10 text-emerald-400" />
                                </div>
                                <h3 className="mb-4 text-4xl font-bold text-white tracking-tight">Sou Clínica</h3>
                                <p className="mb-8 text-lg text-slate-400">Conecte-se aos melhores laboratórios, envie prescrições detalhadas e nunca mais perca um prazo.</p>
                                <ul className="mb-10 space-y-4 text-slate-300">
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Envio de pedidos simplificado</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Acompanhamento de status online</li>
                                    <li className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" /> Arquivo digital seguro do paciente</li>
                                </ul>
                                <Link to="/registro" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 w-full justify-center sm:w-auto">
                                    Criar conta de Clínica <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === FOOTER === */}
            <footer className="border-t border-slate-200/60 bg-slate-50 py-12 text-center text-sm text-slate-500 relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 font-black text-white text-[10px]">
                        EL
                    </div>
                    <span className="font-bold text-slate-900">EloLab</span>
                </div>
                <p>&copy; {new Date().getFullYear()} EloLab Systems. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}