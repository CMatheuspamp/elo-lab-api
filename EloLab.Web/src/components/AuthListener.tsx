import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export function AuthListener() {
    const navigate = useNavigate();

    useEffect(() => {
        // Fica à escuta de todos os eventos do Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            // Se o evento for "Recuperação de Senha", atira o utilizador para a página certa
            if (event === 'PASSWORD_RECOVERY') {
                navigate('/redefinir-senha');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return null; // Este componente é invisível, não desenha nada no ecrã.
}