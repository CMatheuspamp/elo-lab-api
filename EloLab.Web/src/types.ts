// src/types.ts

export interface Laboratorio {
    id: string;
    nome: string;
    // Campos de contato para Perfil e Impressão
    emailContato?: string;
    telefone?: string;
    nif?: string;      // <--- O erro estava aqui (faltava este)
    endereco?: string;
}

export interface Clinica {
    id: string;
    nome: string;
    // Campos de contato
    emailContato?: string;
    telefone?: string;
    nif?: string;
    endereco?: string; // <--- Importante para a Guia de Trabalho
}

export interface Servico {
    id: string;
    nome: string;
    material: string;
    precoBase: number;
    prazoDiasUteis: number;
    descricao?: string;
    ativo: boolean;
}

export interface Trabalho {
    id: string;
    pacienteNome: string;
    dentes?: string;
    corDente?: string;
    dataEntregaPrevista: string;
    valorFinal: number;
    status: 'Pendente' | 'EmProducao' | 'Concluido';

    laboratorioId: string;
    clinicaId: string;
    descricaoPersonalizada?: string;

    // Objetos populados pelo Backend
    laboratorio?: Laboratorio;
    clinica?: Clinica;
    servico?: Servico;

    createdAt: string;
}

export interface UserSession {
    token?: string;
    tipo: 'Laboratorio' | 'Clinica';
    id: string;
    meusDados: {
        id: string;
        usuarioId: string;
        nome: string;
        email: string;
        // Campos de Perfil
        emailContato?: string;
        telefone?: string;
        nif?: string;
        endereco?: string;
    }
}