'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-white hidden sm:block">Nova Inspeção</h1>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              Detalhes do Veículo e Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-400">
              <p>Esta é a página para iniciar uma nova inspeção.</p>
              <p>Aqui, o funcionário selecionará o cliente e o veículo para começar o checklist.</p>
            </div>
            {/* TODO: Implementar seleção de Cliente/Veículo e início do Checklist */}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                Funcionalidade de seleção de cliente e veículo será implementada aqui.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}