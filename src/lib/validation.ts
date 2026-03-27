import { z } from 'zod';

/**
 * Zod Schema for Volunteer (Relawan) Profile
 * 
 * Requirements:
 * - NIK must be exactly 16 digits.
 * - WhatsApp number must follow Indonesian format (+62 or 08).
 * - Mandatory fields: Nama, NIK, WhatsApp, domisili, and tps_target.
 */
export const volunteerSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  nik: z.string()
    .length(16, 'NIK harus tepat 16 digit')
    .regex(/^\d+$/, 'NIK hanya boleh berisi angka'),
  jenis_kelamin: z.enum(['L', 'P']),
  agama: z.string().min(1, 'Agama wajib diisi'),
  pekerjaan: z.string().min(1, 'Pekerjaan wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  no_telp: z.string()
    .min(1, 'Nomor telepon wajib diisi')
    .regex(/^(?:\+62|08)\d{8,13}$/, 'Format nomor telepon tidak valid'),
  deskripsi_pribadi: z.string().min(1, 'Deskripsi pribadi wajib diisi'),
  ktp_url: z.string().url('URL KTP tidak valid'),
  foto_profil_url: z.string().url('URL foto profil tidak valid'),
});

export type VolunteerInput = z.infer<typeof volunteerSchema>;
