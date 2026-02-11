import toast from 'react-hot-toast';

export const notify = {
    success: (message: string) => {
        // Lê a cor atualizada do laboratório/clínica
        const color = localStorage.getItem('elolab_user_color') || '#2563EB';

        toast.success(message, {
            style: {
                borderLeft: `5px solid ${color}`,
                color: '#334155',
            },
            iconTheme: {
                primary: color,
                secondary: '#fff',
            },
        });
    },
    error: (message: string) => {
        toast.error(message, {
            style: {
                borderLeft: `5px solid #ef4444`, // Vermelho de erro
                color: '#334155',
            }
        });
    }
};