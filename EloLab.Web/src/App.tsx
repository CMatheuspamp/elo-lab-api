import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewJob } from './pages/NewJob';
import { JobDetails } from './pages/JobDetails';
import { Services } from "./pages/Services";
import { Partners } from "./pages/Partners";
import { Profile } from './pages/Profile';
import { PrintJob } from "./pages/PrintJob";
import { Layout } from './components/Layout'; // <--- Import Novo

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Login />} />

                {/* Rota de Impressão (Sem sidebar para sair limpa) */}
                <Route path="/print/job/:id" element={<PrintJob />} />

                {/* Rotas com Sidebar */}
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/parceiros" element={<Partners />} />
                    <Route path="/trabalhos/novo" element={<NewJob />} />
                    <Route path="/trabalhos/:id" element={<JobDetails />} />
                    <Route path="/servicos" element={<Services />} />
                    <Route path="/perfil" element={<Profile />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;