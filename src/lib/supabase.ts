import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hbomzwcmalfmfbqqlyus.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhib216d2NtYWxmbWZicXFseXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTk0MjEsImV4cCI6MjA3OTg3NTQyMX0.ncYVXIHbfgSgZxPOseoz6S5fteoe0kQZFGaF6EUi1ak';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Usando credenciais Supabase de fallback. Certifique-se de configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  cargo?: string;
  status: 'active' | 'inactive';
  is_temporary_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  client_id: string;
  type: 'car' | 'motorcycle' | 'van';
  model: string;
  plate: string;
  km_current: number;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  order: number;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  section_id: string;
  title: string;
  options: string[];
  order: number;
  response_type: 'options' | 'text' | 'datetime' | 'autofill';
  created_at: string;
}

export interface Service {
  id: string;
  employee_id: string;
  client_id: string;
  vehicle_id: string;
  checklist_data: any;
  observations?: string;
  photos: string[];
  pdf_url?: string;
  created_at: string;
}