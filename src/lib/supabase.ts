import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL is required');
  if (!supabaseAnonKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  console.error('Please set these variables in your .env.local file');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format:');
  console.error(`  - URL must start with "https://", got: ${supabaseUrl}`);
  console.error('  - Example: https://hbomzwcmalfmfbqqlyus.supabase.co');
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