'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { initializeDatabase, InitResult } from '@/lib/init-db';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initMessage, setInitMessage] = useState('Inicializando sistema...');

  useEffect(() => {
    const initialize = async () => {
      // 1. Forçar logout para limpar qualquer sessão antiga
      signOut();
      
      // Define a timeout promise (5 seconds) to prevent hanging indefinitely
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na inicialização do DB')), 5000)
      );

      try {
        // Inicializar banco de dados e criar usuário master se necessário
        setInitMessage('Verificando banco de dados...');
        
        // Race the DB initialization against a timeout
        const dbResult = await Promise.race([initializeDatabase(), timeoutPromise]) as InitResult;
        
        if (dbResult && dbResult.success) {
          setInitMessage('Sistema pronto!');
        }

        // Verificar usuário atual (deve ser nulo após signOut)
        const user = getCurrentUser();
        
        if (!user) {
          router.push('/login');
        } else if (user.is_temporary_password) {
          router.push('/change-password');
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/employee');
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        toast.error('Erro ao inicializar o sistema. Redirecionando para login.');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-400 text-sm">{initMessage}</p>
      </div>
    );
  }
  
  // Return null once loading is complete and redirection has been initiated
  return null;
}