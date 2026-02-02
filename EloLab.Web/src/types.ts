// src/types.ts

export interface Laboratorio {
    id: string;
    nome: string;
}

export interface Clinica {
    id: string;
    nome: string;
}

// ATUALIZADO: Interface completa para Serviços (incluindo Material)
export interface Servico {
    id: string;
    nome: string;
    material: string;       // <--- Novo campo essencial para o Services.tsx
    precoBase: number;
    prazoDiasUteis: number; // Agora tratado como número
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

    // Status usados no sistema
    status: 'Pendente' | 'EmProducao' | 'Concluido';

    laboratorioId: string;
    clinicaId: string;
    descricaoPersonalizada?: string;

    // Objetos expandidos (Preenchidos pelo Backend via Include)
    laboratorio?: Laboratorio;
    clinica?: Clinica;
    servico?: Servico;
    createdAt: string;
}

// ATUALIZADO: Estrutura alinhada com o retorno do endpoint /Auth/me
export interface UserSession {
    token?: string;
    tipo: 'Laboratorio' | 'Clinica'; // Tipagem estrita ajuda a evitar erros de string
    id: string; // ID genérico
    meusDados: {
        id: string;        // ID Específico da Tabela (Clinica ou Lab)
        usuarioId: string; // ID do Login (Auth)
        nome: string;
        email: string;
    }
}