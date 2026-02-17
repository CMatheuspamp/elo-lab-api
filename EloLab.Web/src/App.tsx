import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api'; // <--- IMPORT DA API ADICIONADO AQUI
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewJob } from './pages/NewJob';
import { JobDetails } from './pages/JobDetails';
import { Services } from "./pages/Services";
import { Partners } from "./pages/Partners";
import { Profile } from './pages/Profile';
import { PrintJob } from "./pages/PrintJob";
import { Layout } from './components/Layout';
import { Clinics } from './pages/Clinics';
import { Notifications } from './pages/Notifications';
import { PriceTables } from './pages/PriceTables';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { Agenda } from './pages/Agenda';
import { Financeiro } from './pages/Financeiro';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AuthListener } from './components/AuthListener';
import { PendingApproval } from "./pages/PendingApproval.tsx";
// === IMPORT DO NOVO COMPONENTE ADMIN ===
import { Admin } from './pages/Admin';
import { Toaster } from 'react-hot-toast';
import { signalRService } from './services/signalRService';

function App() {

    useEffect(() => {
        signalRService.startConnection();

        // === TRAVA DE SEGURANÇA NO REFRESH (F5) ===
        const token = localStorage.getItem('elolab_token');
        if (token) {
            api.get('/Auth/me').then(res => {
                const d = res.data;
                if (d.tipo === 'Laboratorio' && d.meusDados) {

                    // 1. Se o laboratório foi bloqueado enquanto estava offline, expulsa-o agora!
                    if (!d.meusDados.ativo && !localStorage.getItem('elolab_is_admin')) {
                        localStorage.clear();
                        window.location.href = '/pendente';
                        return;
                    }

                    // 2. Garante que as cores na memória batem com o servidor
                    let mudouAlgo = false;
                    if (d.meusDados.corPrimaria && localStorage.getItem('elolab_user_color') !== d.meusDados.corPrimaria) {
                        localStorage.setItem('elolab_user_color', d.meusDados.corPrimaria);
                        mudouAlgo = true;
                    }
                    if (d.meusDados.logoUrl && localStorage.getItem('elolab_user_logo') !== d.meusDados.logoUrl) {
                        localStorage.setItem('elolab_user_logo', d.meusDados.logoUrl);
                        mudouAlgo = true;
                    }

                    // Se detetou uma mudança na cor após F5, recarrega limpo para aplicar
                    if (mudouAlgo) window.location.reload();
                }
            }).catch(() => {
                // Se o token estiver inválido (ex: revogado no backend), apaga e manda para o login
                localStorage.clear();
                window.location.href = '/';
            });
        }

        return () => {
            signalRService.stopConnection();
        };
    }, []);

    return (
        <BrowserRouter>
            <AuthListener />
            <Toaster
                position="top-right"
                toastOptions={{
                    className: 'text-sm font-bold shadow-xl rounded-xl',
                    duration: 4000,
                }}
            />
            <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/pendente" element={<PendingApproval />} />
                <Route path="/esqueci-senha" element={<ForgotPassword />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />

                <Route path="/registro" element={<Register />} />
                <Route path="/registro-clinica" element={<Register />} />

                <Route path="/print/job/:id" element={<PrintJob />} />

                {/* Rotas Privadas (Com Sidebar/Layout) */}
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/portal/:labId" element={<Dashboard />} />

                    <Route path="/parceiros" element={<Partners />} />
                    <Route path="/clinicas" element={<Clinics />} />
                    <Route path="/trabalhos/novo" element={<NewJob />} />
                    <Route path="/trabalhos/:id" element={<JobDetails />} />
                    <Route path="/servicos" element={<Services />} />
                    <Route path="/tabelas" element={<PriceTables />} />
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/notificacoes" element={<Notifications />} />
                    <Route path="/perfil" element={<Profile />} />

                    {/* === ROTA DO SUPER ADMIN === */}
                    <Route path="/admin" element={<Admin />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;