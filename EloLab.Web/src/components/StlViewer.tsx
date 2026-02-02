import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Center, Html, useProgress } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { Loader2, Box, AlertTriangle } from 'lucide-react';

interface StlViewerProps {
    url: string;
}

// 1. Componente de Loading
function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-white bg-black/50 p-4 rounded-xl backdrop-blur-md">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-xs font-bold">{progress.toFixed(0)}% carregado</span>
            </div>
        </Html>
    );
}

// 2. O Modelo 3D
function Model({ url }: { url: string }) {
    const geom = useLoader(STLLoader, url);

    return (
        <group dispose={null}>
            <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#f5f5f5"
                    roughness={0.5}
                    metalness={0.1}
                    clearcoat={0.8}
                />
            </mesh>
        </group>
    );
}

// 3. Error Boundary (Correção aplicada aqui)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    // CORREÇÃO: Adicionei o "_" antes de error para o TS ignorar
    static getDerivedStateFromError(_error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        // Aqui usamos as variáveis no console, então não dá erro
        console.error("Erro no 3D:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Html center>
                    <div className="flex flex-col items-center gap-2 text-red-200 bg-red-900/80 p-6 rounded-xl text-center w-64">
                        <AlertTriangle className="h-8 w-8" />
                        <p className="text-sm font-bold">Não foi possível carregar o modelo 3D.</p>
                        <p className="text-xs opacity-70">Verifique se o arquivo existe ou se a API está online.</p>
                    </div>
                </Html>
            );
        }
        return this.props.children;
    }
}

export function StlViewer({ url }: StlViewerProps) {
    // Limpeza da URL
    const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");

    return (
        <div className="h-[400px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-inner relative">

            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                <Box className="h-3 w-3" /> Visualizador 3D
            </div>

            <Canvas shadows camera={{ position: [0, 0, 100], fov: 50 }}>
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <Stage environment="city" intensity={0.6}>
                            <Center>
                                <Model url={cleanUrl} />
                            </Center>
                        </Stage>
                    </Suspense>
                </ErrorBoundary>
                <OrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />
            </Canvas>

            <div className="absolute bottom-4 left-0 w-full text-center text-xs text-slate-500 pointer-events-none">
                Clique e arraste para girar • Roda do rato para zoom
            </div>
        </div>
    );
}