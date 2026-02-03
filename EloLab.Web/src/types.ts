// src/types.ts

export interface Laboratorio {
    id: string;
    nome: string;
    // Campos de contato
    emailContato?: string;
    telefone?: string;
    nif?: string;
    endereco?: string;

    // === NOVOS CAMPOS DE APARÊNCIA ===
    corPrimaria?: string;
    logoUrl?: string;
}

export interface Clinica {
    id: string;
    nome: string;
    // Campos de contato
    emailContato?: string;
    telefone?: string;
    nif?: string;
    endereco?: string;

    // Deixamos preparado caso queiras personalizar clínicas no futuro
    corPrimaria?: string;
    logoUrl?: string;
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

    // URL do anexo principal (3D) para visualização rápida
    arquivoUrl?: string;

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

        // === APARÊNCIA ===
        corPrimaria?: string;
        logoUrl?: string;
    }
}