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

// Credenciais do Master (Revertidas para senha temporária)
const MASTER_CONFIG = {
    email: "leonardo.negri@outlook.com.br", // Mantém o email como identificador único
    password: "1234", // Senha TEMPORÁRIA
    name: "Leonardo Negri", // Nome de usuário
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
    await dyad.init();

    let hasMaster = false;
    try {
      hasMaster = await dyad.hasUserMaster();
    } catch (hasErr) {
      console.warn("hasUserMaster falhou, assumindo que o Master precisa ser recriado:", hasErr);
      hasMaster = false;
    }

    // Se não tem master, ou se forceReset for true (o que é o padrão no Home/Login), forçamos a recriação
    if (!hasMaster || forceReset) {
      if (hasMaster) {
        console.log("⚠️ Master encontrado, mas forçando reset para aplicar nova senha temporária.");
      } else {
        console.log("👤 Nenhum master encontrado. Criando Master com senha temporária...");
      }
      
      // Força o reset para limpar qualquer registro parcial ou antigo
      await dyad.reset(); 
      
      try {
        await dyad.createUserMaster(MASTER_CONFIG);
        console.log("✔ Master criado com sucesso com senha temporária.");
      } catch (createErr: any) {
        console.error("Erro ao criar master:", createErr);
        throw new Error(`Falha crítica ao criar usuário master: ${createErr.message || 'Erro desconhecido'}`);
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