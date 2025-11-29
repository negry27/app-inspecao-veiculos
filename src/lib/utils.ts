import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma placa de veículo (7 caracteres alfanuméricos) para o formato visual XXX-XXXX.
 * @param value A placa sem formatação (ex: ABC1234).
 * @returns A placa formatada (ex: ABC-1234).
 */
export function formatPlateDisplay(value: string): string {
  if (!value) return '';
  
  // Remove caracteres não alfanuméricos e converte para maiúsculas
  const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Retorna a placa limpa, sem formatação visual
  return cleanValue;
}