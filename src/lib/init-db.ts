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

// Credenciais do Master (Atualizadas)
const MASTER_CONFIG = {
    email: "leonardo.negri@outlook.com.br", // Mantém o email como identificador único
    password: "newmasterpassword123", // Nova senha temporária
    name: "Leonardo Negri", // Novo nome de usuário
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
 * Inicializa o banco de dados e cria o usuário administrador master
 */
export async function initializeDatabase(forceReset = true): Promise<InitResult> {
  if (typeof window === 'undefined') {
    return { success: true, message: 'Server side initialization skipped.' };
  }
  
  if (dyadInstance) return { success: true, message: 'Dyad já inicializado.' };
  if (initializing) {
    const dyad = await waitForInit();
    return { success: true, message: 'Dyad inicializado por outra instância.', user: dyad };
  }

  initializing = true;
  console.log("🔧 Inicializando Dyad...");

  const dyad = new Dyad({
    encryptionKey: ENCRYPTION_KEY,
    namespace: "my-app-db",
    verbose: true,
  });

  try {
    // Tenta init; se falhar e forceReset=true → reset + init novamente
    try {
      await dyad.init();
    } catch (initErr) {
      console.warn("Dyad init falhou:", initErr);
      if (forceReset) {
        console.warn("Executando reset forçado...");
        await dyad.reset();
        await dyad.init();
      } else {
        throw initErr;
      }
    }

    // Verifica hasUserMaster robustamente
    let hasMaster = false;
    try {
      hasMaster = await dyad.hasUserMaster();
    } catch (hasErr) {
      console.warn("hasUserMaster falhou:", hasErr);
      if (forceReset) {
        await dyad.reset();
        await dyad.init();
        hasMaster = false;
      } else {
        throw hasErr;
      }
    }

    // Se não tem master, cria
    if (!hasMaster) {
      console.log("👤 Nenhum master encontrado. Criando...");
      try {
        await dyad.createUserMaster(MASTER_CONFIG);
        console.log("✔ Master criado com sucesso.");
      } catch (createErr: any) {
        console.error("Erro ao criar master (primeira tentativa):", createErr);

        // Se falhar, tenta um reset forçado e uma segunda tentativa
        console.warn("Tentando reset forçado e recriação do master...");
        await dyad.reset();
        await dyad.init();

        try {
            // Tenta criar novamente (lançará se falhar)
            await dyad.createUserMaster(MASTER_CONFIG);
            console.log("✔ Master recriado com sucesso após reset.");
        } catch (retryErr: any) {
            console.error("Erro ao criar master (segunda tentativa):", retryErr);
            throw new Error(`Falha crítica ao criar usuário master: ${retryErr.message || 'Erro desconhecido'}`);
        }
      }
    } else {
      console.log("✔ Master já presente — seguindo normalmente.");
    }

    dyadInstance = dyad;
    return { success: true, message: 'Inicialização completa.', user: dyadInstance };
  } catch (err: any) {
    console.error("❌ Erro crítico ao inicializar Dyad:", err);
    return { success: false, error: err.message || 'Erro crítico na inicialização.' };
  } finally {
    initializing = false;
  }
}