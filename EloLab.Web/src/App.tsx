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
                {/* Rotas Públicas */}
                <Route path="/" element={<Login />} />
                <Route path="/print/job/:id" element={<PrintJob />} />

                {/* Rotas com Sidebar */}
                <Route element={<Layout />}>
                    {/* Dashboard Geral (Lab) */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Portal do Lab (Acesso da Clínica) */}
                    <Route path="/portal/:labId" element={<Dashboard />} />

                    <Route path="/parceiros" element={<Partners />} />
                    <Route path="/trabalhos/novo" element={<NewJob />} />
                    <Route path="/trabalhos/:id" element={<JobDetails />} />
                    <Route path="/servicos" element={<Services />} />
                    <Route path="/perfil" element={<Profile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;