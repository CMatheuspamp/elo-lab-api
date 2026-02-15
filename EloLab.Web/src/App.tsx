import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    className: 'text-sm font-bold shadow-xl rounded-xl',
                    duration: 4000,
                }}
            />
            <Routes>
                {/* === Rotas Públicas === */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />

                {/* As nossas novas rotas de registo */}
                <Route path="/registro" element={<Register />} />
                <Route path="/registro-clinica" element={<Register />} />

                <Route path="/print/job/:id" element={<PrintJob />} />

                {/* === Rotas Privadas (Com Sidebar/Layout) === */}
                <Route element={<Layout />}>
                    {/* Dashboard Geral (Lab) */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Portal do Lab (Acesso da Clínica) */}
                    <Route path="/portal/:labId" element={<Dashboard />} />

                    <Route path="/parceiros" element={<Partners />} />
                    <Route path="/clinicas" element={<Clinics />} />
                    <Route path="/trabalhos/novo" element={<NewJob />} />
                    <Route path="/trabalhos/:id" element={<JobDetails />} />
                    <Route path="/servicos" element={<Services />} />
                    <Route path="/tabelas" element={<PriceTables />} />
                    <Route path="/agenda" element={<Agenda />} />

                    {/* === NOVA ROTA DO FINANCEIRO === */}
                    <Route path="/financeiro" element={<Financeiro />} />

                    <Route path="/notificacoes" element={<Notifications />} />
                    <Route path="/perfil" element={<Profile />} />
                </Route>

                {/* Rota de fallback (Se não encontrar nada, volta ao início) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;