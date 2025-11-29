import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

interface MasterUserConfig {
  email: string;
  password: string;
  name: string;
}

// Define the master user email for internal checks
const MASTER_EMAIL = 'leonardo.negri@outlook.com.br';

export class Dyad {
  private encryptionKey: string;
  private namespace: string;
  private verbose: boolean;

  constructor(config: { encryptionKey: string; namespace: string; verbose: boolean }) {
    this.encryptionKey = config.encryptionKey;
    this.namespace = config.namespace;
    this.verbose = config.verbose;
  }

  public async init(): Promise<void> {
    if (this.verbose) console.log(`[Dyad Wrapper] Initializing namespace: ${this.namespace}`);
    // Supabase client is already initialized, so this is a placeholder for connection check
    return Promise.resolve();
  }

  public async hasUserMaster(): Promise<boolean> {
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', MASTER_EMAIL)
      .eq('is_master', true)
      .limit(1)
      .single();

    // PGRST116 means 'no rows found'
    if (error && error.code !== 'PGRST116') { 
        if (this.verbose) console.error('[Dyad Wrapper] Error checking master user:', error);
        throw new Error(`Failed to check master existence: ${error.message}`);
    }

    return !!existingUser;
  }

  public async createUserMaster(config: MasterUserConfig): Promise<void> {
    if (config.email !== MASTER_EMAIL) {
        throw new Error("Attempted to create master user with incorrect email.");
    }
    
    // A senha deve ser hasheada
    const hashedPassword = await bcrypt.hash(config.password, 10);
    
    // Se a senha for '1234' ou 'admin', definimos como temporária.
    const isTemporary = config.password === '1234' || config.password === 'admin';

    const { error } = await supabase
      .from('users')
      .insert({
        email: config.email,
        username: config.name,
        password_hash: hashedPassword,
        role: 'admin',
        cargo: 'Administrador Master',
        status: 'active',
        is_master: true,
        is_temporary_password: isTemporary,
        email_confirmed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      // Código de erro 23505 é a violação de restrição de unicidade (Unique constraint violation)
      if (error.code === '23505') {
        if (this.verbose) console.warn('[Dyad Wrapper] Master user already exists (23505 error ignored).');
        return;
      }
      
      // Se for outro erro, lançamos
      const errorMessage = error.message || JSON.stringify(error);
      if (this.verbose) console.error('[Dyad Wrapper] Error creating master user:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  public async reset(): Promise<void> {
    if (this.verbose) console.log('[Dyad Wrapper] Performing soft user database reset (deleting master)...');
    
    // Attempt to delete the master user to allow recreation
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', MASTER_EMAIL);
        
    if (error) {
        if (this.verbose) console.warn(`[Dyad Wrapper] Soft reset failed (could not delete master user): ${error.message}`);
    } else {
        if (this.verbose) console.log('[Dyad Wrapper] Soft reset successful (master user deleted if existed).');
    }
  }
}