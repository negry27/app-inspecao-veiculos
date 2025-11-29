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
      setTimeout(check, 30);
    };
    check();
  });
}

/**
 * Inicializa o banco de dados e cria o usuário administrador master
 */
export async function initializeDatabase(): Promise<InitResult> {
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
  } catch (e) {
    console.warn("⚠ Dyad init falhou, resetando...");
    await dyad.reset();
    await dyad.init();
  }

  // 1 — Verifica se existe master
  let hasMaster = false;
  try {
    hasMaster = await dyad.hasUserMaster();
  } catch (e) {
    console.warn("⚠ Erro ao verificar master, resetando banco...");
    await dyad.reset();
    await dyad.init();
  }

  // 2 — Se não existe master, cria
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
        console.error("❌ Erro ao criar master:", err);

        // ✨ Erro {} → reset forçado
        console.warn("⚠ Resetando banco devido a erro vazio ou falha crítica...");
        await dyad.reset();
        await dyad.init();

        // Tenta novamente
        await dyad.createUserMaster(MASTER_CONFIG);
        console.log("✔ Banco resetado e master recriado");
      }
    }
  } else {
    console.log("✔ Master já existe, seguindo normalmente");
  }

  dyadInstance = dyad;
  initializing = false;
  return { success: true, message: 'Inicialização completa.', user: dyadInstance };
}