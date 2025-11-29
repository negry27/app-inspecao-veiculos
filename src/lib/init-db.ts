import { Dyad } from './dyad-db-wrapper';

export interface InitResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
}

// 🔐 Gere e substitua por uma chave real de 32 bytes (Mantido conforme o script do usuário)
const ENCRYPTION_KEY = "MINHA_CHAVE_SECRETA_32_BYTES________";

let dyad: Dyad | null = null;

// Credenciais do Master (Mantidas as originais do projeto)
const MASTER_CONFIG = {
    email: "leonardo.negri@outlook.com.br",
    password: "Leonardoo28@#!",
    name: "Administrador Master",
};

/**
 * Inicializa o banco de dados e cria o usuário administrador master
 */
export async function initializeDatabase(): Promise<InitResult> {
  try {
    if (typeof window === 'undefined') {
        // Não executar inicialização do DB no servidor
        return { success: true, message: 'Server side initialization skipped.' };
    }
    
    console.log("🔧 Inicializando Dyad Wrapper...");

    // 1. Inicializa o Dyad
    dyad = new Dyad({
      encryptionKey: ENCRYPTION_KEY,
      namespace: "my-app-db",
      verbose: true,
    });

    await dyad.init();

    console.log("✔ Dyad Wrapper inicializado");

    // 2. Verifica se já existe usuário master
    const hasMaster = await dyad.hasUserMaster();

    if (!hasMaster) {
      console.log("👤 Nenhum master encontrado. Criando...");

      try {
        await dyad.createUserMaster(MASTER_CONFIG);

        console.log("✔ Usuário master criado com sucesso");

      } catch (err: any) {
        console.error("❌ Falha ao criar usuário master:", err);

        // Se o erro for silencioso ({}) ou banco corrompido → reset total
        console.warn("⚠ Tentando resetar banco e recriar...");

        await dyad.reset(); // limpa o master

        // Tenta recriar
        await dyad.createUserMaster(MASTER_CONFIG);

        console.log("✔ Banco resetado e master recriado");
      }

    } else {
      console.log("✔ Usuário master já existe. Nada a criar.");
    }
    
    return { success: true, message: 'Inicialização completa.' };

  } catch (error: any) {
    console.error("❌ Erro crítico ao inicializar o banco:", error);

    // Último recurso → limpar base quebrada
    if (dyad) {
      await dyad.reset();
    }
    
    return { success: false, error: error.message || 'Erro crítico na inicialização.' };
  }
}