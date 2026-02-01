// src/types.ts

export interface Laboratorio {
    id: string;
    nome: string;
}

export interface Clinica {
    id: string;
    nome: string;
}

// Interface para o Dropdown de Serviços
export interface Servico {
    id: string;
    nome: string;
    precoBase: number;
    prazoDiasUteis?: number;
    descricao?: string;
}

export interface Trabalho {
    id: string;
    pacienteNome: string;
    dentes?: string;
    corDente?: string;
    dataEntregaPrevista: string;
    valorFinal: number;
    status: 'Pendente' | 'EmProducao' | 'Concluido' | 'Entregue';
    laboratorioId: string;
    clinicaId: string;

    // O campo correto conforme o seu Backend:
    descricaoPersonalizada?: string;

    laboratorio?: Laboratorio;
    clinica?: Clinica;
    servico?: Servico;
    createdAt: string;
}

export interface UserSession {
    tipo: string;
    seuId: string;
    meusDados: {
        id: string; // Necessário para criar pedidos
        nome: string;
        email?: string;
    }
}