import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewJob } from './pages/NewJob';
import { JobDetails } from './pages/JobDetails';
import { Services } from "./pages/Services";
import { Partners } from "./pages/Partners"; // <--- Novo Import
import { Profile } from './pages/Profile';
import { PrintJob } from "./pages/PrintJob.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Login />} />

                {/* Rotas Privadas (Futuramente pode envolver em um PrivateRoute) */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/parceiros" element={<Partners />} /> {/* <--- Nova Rota */}

                <Route path="/trabalhos/novo" element={<NewJob />} />
                <Route path="/trabalhos/:id" element={<JobDetails />} />
                <Route path="/servicos" element={<Services />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/print/job/:id" element={<PrintJob />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;