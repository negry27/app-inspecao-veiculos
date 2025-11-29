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

/**
 * Formata um número de telefone para o formato visual (xx) x xxxx-xxxx ou (xx) xxxx-xxxx.
 * @param value O número de telefone.
 * @returns O número formatado.
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '';
  
  // 1. Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, '');

  // 2. Aplica a máscara (xx) x xxxx-xxxx (11 dígitos)
  if (numericValue.length > 11) {
    return numericValue.substring(0, 11).replace(
      /^(\d{2})(\d{1})(\d{4})(\d{4})$/,
      '($1) $2 $3-$4'
    );
  }
  
  // Aplica a máscara (xx) x xxxx-xxxx (11 dígitos)
  if (numericValue.length === 11) {
    return numericValue.replace(
      /^(\d{2})(\d{1})(\d{4})(\d{4})$/,
      '($1) $2 $3-$4'
    );
  }
  
  // Aplica a máscara (xx) xxxx-xxxx (10 dígitos)
  if (numericValue.length === 10) {
    return numericValue.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }
  
  // Aplica a máscara parcial
  if (numericValue.length > 2) {
    return `(${numericValue.substring(0, 2)}) ${numericValue.substring(2)}`;
  }
  
  if (numericValue.length > 0) {
    return `(${numericValue}`;
  }

  return numericValue;
}