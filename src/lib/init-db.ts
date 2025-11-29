import { Dyad } from './dyad-db-wrapper';

export interface InitResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
}

// 🔐 Gere e substitua por uma chave real de 32 bytes
const ENCRYPTION_KEY = "MINHA_CHAVE_SECRETA_32_BYTES________";

let dyadInstance: Dyad | null = null;
let initializing = false;

// Credenciais do Master
const MASTER_CONFIG = {
    email: "leonardo.negri@outlook.com.br",
    password: "Leonardoo28@#!",
    name: "Administrador Master",
};

/**
 * Aguarda inicialização se outra página já iniciou
 */
function waitForInit(): Promise<Dyad | null> {
  return new Promise(resolve => {
    const check = () => {
      if (dyadInstance) return resolve(dyadInstance);
      setTimeout(check, 50);
    };
    check();
  });
}

/**
 * Inicializa o Dyad, verifica e cria o usuário master de forma robusta.
 * Retorna a instância do Dyad.
 */
export async function initializeDatabase(): Promise<InitResult> {
  if (typeof window === 'undefined') {
    return { success: true, message: 'Server side initialization skipped.' };
  }
  
  if (dyadInstance) return { success: true, message: 'Dyad já inicializado.' };

  // Evita rodar em paralelo em duas telas
  if (initializing) {
    await waitForInit();
    return { success: true, message: 'Dyad inicializado por outra instância.' };
  }

  initializing = true;
  console.log("🔧 Inicializando Dyad...");

  try {
    const dyad = new Dyad({
      encryptionKey: ENCRYPTION_KEY,
      namespace: "my-app-db",
      verbose: true,
    });

    await dyad.init();

    // 2. Verifica se já existe master
    let hasMaster = false;

    try {
      hasMaster = await dyad.hasUserMaster();
    } catch (err) {
      console.warn("⚠ Falha ao verificar master, resetando banco...");
      await dyad.reset();
      hasMaster = false; // Força a criação após o reset
    }

    if (!hasMaster) {
      console.log("👤 Nenhum master encontrado. Criando...");
      try {
        await dyad.createUserMaster(MASTER_CONFIG);
        console.log("✔ Master criado com sucesso");
      } catch (err: any) {
        const errorMessage = String(err);
        
        if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
          console.warn("✔ Master já existia — ignorando criação");
        } else {
          console.error("❌ Erro ao criar master, resetando banco...", err);
          await dyad.reset();

          // Tenta novamente
          await dyad.createUserMaster(MASTER_CONFIG);
          console.log("✔ Banco resetado e master recriado");
        }
      }
    } else {
      console.log("✔ Master já existe, seguindo normalmente");
    }

    dyadInstance = dyad;
    return { success: true, message: 'Inicialização completa.' };

  } catch (error: any) {
    console.error("❌ Erro crítico no Dyad:", error);

    // Último recurso → limpar base quebrada
    if (dyadInstance) {
      await dyadInstance.reset();
    }
    
    return { success: false, error: error.message || 'Erro crítico na inicialização.' };
  } finally {
    initializing = false;
  }
}