'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { initializeDatabase } from '@/lib/init-db';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initMessage, setInitMessage] = useState('Inicializando sistema...');

  useEffect(() => {
    const initialize = async () => {
      try {
        // Inicializar banco de dados e criar usuário master se necessário
        setInitMessage('Verificando banco de dados...');
        const dbResult = await initializeDatabase();
        
        if (dbResult.success) {
          setInitMessage('Sistema pronto!');
        }

        // Verificar usuário atual
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
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-gray-400 text-sm">{initMessage}</p>
    </div>
  );
}
