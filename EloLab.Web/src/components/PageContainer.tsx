import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    primaryColor?: string;
}

export function PageContainer({ children, primaryColor }: PageContainerProps) {
    const colorToUse = primaryColor || localStorage.getItem('elolab_user_color') || '#2563EB';

    return (
        <div className="relative min-h-screen w-full bg-slate-50 transition-colors duration-700">

            {/* === ELEMENTOS VISUAIS (FIXOS) === */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">

                {/* MUDANÇAS AQUI:
                    1. Adicionado 'mix-blend-multiply': Dá peso e saturação à cor contra o fundo claro.
                    2. Aumentada a 'opacity': Para tornar o efeito mais presente.
                */}

                {/* Mancha 1 (Principal - Topo Direito) */}
                <div
                    className="absolute -top-[20%] -right-[10%] h-[800px] w-[800px] rounded-full blur-[100px] transition-all duration-1000 mix-blend-multiply opacity-[0.25]" // Opacidade aumentada de 0.12 para 0.25
                    style={{ backgroundColor: colorToUse }}
                />

                {/* Mancha 2 (Secundária - Fundo Esquerdo) */}
                <div
                    className="absolute -bottom-[10%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[80px] transition-all duration-1000 mix-blend-multiply opacity-[0.20]" // Opacidade aumentada de 0.08 para 0.20
                    style={{ backgroundColor: colorToUse }}
                />

                {/* Mancha 3 (Terciária - Topo Centro) */}
                <div
                    className="absolute top-[-10%] left-[20%] h-[400px] w-[600px] rounded-full blur-[90px] transition-all duration-1000 mix-blend-multiply opacity-[0.15]" // Opacidade aumentada de 0.05 para 0.15
                    style={{ backgroundColor: colorToUse }}
                />
            </div>

            {/* === CONTEÚDO DA PÁGINA === */}
            <div className="relative z-10 p-6 md:p-8 pb-20">
                <div className="mx-auto max-w-7xl">
                    {children}
                </div>
            </div>

        </div>
    );
}