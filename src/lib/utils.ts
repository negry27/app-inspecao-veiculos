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
  
  // Limita a 7 caracteres
  const rawPlate = cleanValue.substring(0, 7);
  
  if (rawPlate.length === 7) {
    // Aplica o hífen após o terceiro caractere
    return rawPlate.replace(
      /^([a-zA-Z0-9]{3})([a-zA-Z0-9]{4})$/,
      '$1-$2'
    );
  }
  
  return rawPlate;
}