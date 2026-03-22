export type EquipmentCategory = 'Fire Equipment' | 'Heavy Equipment' | 'Bejana Tekan' | 'Tangki Timbun' | 'Lain-lain';

export interface EquipmentSpecs {
  capacity?: string;
  volume?: string;
  designPressure?: string;
  workingPressure?: string;
  customCategoryName?: string;
}

export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'superadmin';

export interface Profile {
  id: string;
  employee_id: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Inspection {
  id: string;
  date: string;
  status: 'Good' | 'Needs Repair' | 'Critical';
  notes: string;
  performedBy: string;
  type: string; // e.g., "Riksa Uji 1", "Riksa Uji 2"
}

export interface Equipment {
  id: string;
  equipmentNo: string;
  equipmentName: string;
  equipmentType: string;
  category: EquipmentCategory;
  department: string;
  specs: EquipmentSpecs;
  qrUrl: string;
  lastInspectionDate?: string;
  validityPeriod?: '6 Bulan' | '1 Tahun' | '2 Tahun' | '3 Tahun';
  nextInspectionDate?: string;
  status: 'Good' | 'Needs Repair' | 'Critical';
  updatedAt: string;
  updatedBy?: string;
  inspections?: Inspection[];
}
