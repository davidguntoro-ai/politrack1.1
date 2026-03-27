export enum UserRole {
  KANDIDAT = 'KANDIDAT',
  KOORCAM = 'KOORCAM',
  DATA_ENTRY = 'DATA_ENTRY',
  RELAWAN = 'RELAWAN',
}

export const PROFESSIONS = [
  "Petani", "Nelayan", "Pedagang", "Buruh", "IRT", 
  "Mahasiswa", "Wiraswasta", "Guru Swasta", "ASN", "TNI", "POLRI"
] as const;

export type Profession = typeof PROFESSIONS[number];

export const NEUTRAL_PROFESSIONS: Profession[] = ["ASN", "TNI", "POLRI"];

export interface Tenant {
  id: string;
  name: string;
  candidate_name?: string;
  candidate_photo_url?: string;
  primary_color: string;
  logo_url: string;
  wa_greeting_enabled?: boolean;
  wa_greeting_template?: string;
  isSummaryEnabled?: boolean;
  summaryRecipientPhone?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  // Volunteer Profile Data
  nama_lengkap?: string;
  nik_encrypted?: string;
  no_telp?: string;
  jenis_kelamin?: 'L' | 'P';
  agama?: string;
  pekerjaan?: string;
  alamat?: string;
  deskripsi_pribadi?: string;
  ktp_url?: string;
  foto_profil_url?: string;
  kode_relawan?: string;
  is_active?: boolean;
  // Optional/Audit Fields
  tgl_lahir?: string;
  domisili?: string;
  tps_target?: string;
  ukuran_baju?: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  organisasi?: string;
  isLocked?: boolean;
  reliabilityScore?: number;
  auditStatus?: 'clean' | 'suspicious' | 'fraudulent';
}

export interface SupportData {
  district_id: string;
  district_name: string;
  support_percentage: number;
}
