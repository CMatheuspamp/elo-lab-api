import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewJob } from './pages/NewJob'; // <--- Importe aqui
import { JobDetails } from './pages/JobDetails';
import { Services } from "./pages/Services.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trabalhos/novo" element={<NewJob />} />
                <Route path="/trabalhos/:id" element={<JobDetails />} />
                <Route path="/servicos" element={<Services />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;