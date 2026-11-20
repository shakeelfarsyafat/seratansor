export type Role = 'Admin' | 'Ketua' | 'Sekretaris' | 'Operator';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  role: Role;
  signaturePath?: string; // Data URL or path
  parafPath?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  password?: string;
}

export type LetterStatus = 'Draft' | 'Diajukan' | 'Ditandatangani' | 'Ditolak';

export interface SignatureSigner {
  id: string;
  userId: string;
  userName: string;
  userPosition: string;
  role: 'Ketua' | 'Sekretaris';
  order: number; // 1 = Ketua, 2 = Sekretaris
  status: 'Menunggu' | 'Ditandatangani' | 'Ditolak';
  signedAt?: string;
  notes?: string;
}

export interface LetterTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  signersRequired: 'Ketua' | 'Ketua_dan_Sekretaris';
  fields: {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'time' | 'select' | 'number';
    placeholder?: string;
    required: boolean;
    options?: string[];
  }[];
  contentStructure: string;
  isActive: boolean;
  uploadedFileName?: string;
  customHtml?: string;
  rawText?: string;
  content?: string;
}

export interface OutgoingLetter {
  id: string;
  referenceNumber: string;
  templateId: string;
  templateName: string;
  category: string;
  subject: string;
  destination: string;
  dateHijri: string;
  dateGregorian: string;
  placeOfLetter: string;
  dynamicData: Record<string, any>;
  status: LetterStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  signers: SignatureSigner[];
  signedAt?: string;
  verificationCode: string;
  rejectionNotes?: string;
  isLocked: boolean;
  isArchived: boolean;
  fileUrl?: string;
}

export interface IncomingLetter {
  id: string;
  letterNumber: string;
  sender: string;
  letterDate: string;
  receivedDate: string;
  subject: string;
  category: string;
  notes?: string;
  scanUrl?: string;
  dispositions: Disposition[];
  createdAt: string;
}

export interface Disposition {
  id: string;
  to: string;
  instruction: string;
  date: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai';
}

export interface Institution {
  name: string;
  level: 'PW' | 'PC' | 'PAC' | 'PR';
  code: string;
  regionCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  kopHeader1: string;
  kopHeader2: string;
  kopSubheader: string;
  logoUrl?: string;
}

export interface NumberingConfig {
  formatPattern: string; // contoh: {SEQ}/PW-GPAnsor/{WIL}/{ROMAN}/{YEAR}
  currentSequence: number;
  year: number;
  autoResetYearly: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  targetRole?: Role;
  targetUserId?: string;
  letterId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  description: string;
  target: string;
  ipAddress?: string;
  timestamp: string;
}
