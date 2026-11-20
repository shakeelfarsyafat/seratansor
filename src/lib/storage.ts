import { User, OutgoingLetter, IncomingLetter, LetterTemplate, Institution, NumberingConfig, AppNotification, ActivityLog, Role } from '@/types';
import { INITIAL_USERS, INITIAL_INSTITUTION, INITIAL_NUMBERING, INITIAL_TEMPLATES, INITIAL_OUTGOING_LETTERS, INITIAL_INCOMING_LETTERS, INITIAL_NOTIFICATIONS, INITIAL_LOGS } from './initialData';

const KEYS = {
  USERS: 'eserats_users',
  CURRENT_USER: 'eserats_current_user',
  SESSION_TYPE: 'eserats_session_type',
  LAST_ACTIVITY: 'eserats_last_activity',
  INSTITUTION: 'eserats_institution',
  NUMBERING: 'eserats_numbering',
  TEMPLATES: 'eserats_templates',
  OUTGOING: 'eserats_outgoing_letters',
  INCOMING: 'eserats_incoming_letters',
  NOTIFICATIONS: 'eserats_notifications',
  LOGS: 'eserats_activity_logs',
};

// Batas waktu inaktivitas sesi: 60 menit
export const SESSION_INACTIVITY_LIMIT_MS = 60 * 60 * 1000;

// Safe storage access (handles SSR safely)
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
}

// ---------------- User Management ----------------
export function getUsers(): User[] {
  const users = getStorageItem<User[]>(KEYS.USERS, INITIAL_USERS);
  let updated = false;
  const normalized = users.map((u) => {
    let username = u.username;
    let name = u.name;
    let position = u.position;
    if (u.role === 'Ketua' && (name === 'H. Deni Ahmad Haidar, M.Si' || !name)) {
      name = 'H. SUBHAN FAHMI';
      position = 'Ketua';
      updated = true;
    }
    if (u.role === 'Sekretaris' && (name === 'Johan J. Ansori, S.Pd.I' || !name)) {
      name = 'H. EDI RUSYANDI';
      position = 'Sekretaris';
      updated = true;
    }
    if (!username) {
      updated = true;
      if (u.role === 'Admin') username = 'admin';
      else if (u.role === 'Ketua') username = 'ketua_pw';
      else if (u.role === 'Sekretaris') username = 'sekretaris_pw';
      else username = 'staf_tu';
    }
    const password = u.password || 'password123';
    return { ...u, username, name, position, password };
  });

  if (updated && typeof window !== 'undefined') {
    setStorageItem(KEYS.USERS, normalized);
  }
  return normalized;
}

export function saveUsers(users: User[]): void {
  setStorageItem(KEYS.USERS, users);
}

// Update timestamp aktivitas pengguna untuk mencegah sesi kedaluwarsa saat aktif
export function updateLastActivity(): void {
  if (typeof window === 'undefined') return;
  try {
    const now = String(Date.now());
    sessionStorage.setItem(KEYS.LAST_ACTIVITY, now);
    localStorage.setItem(KEYS.LAST_ACTIVITY, now);
  } catch {}
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Cek sesi di sessionStorage (prioritas sesi aktif saat ini)
    const sessionStr = sessionStorage.getItem(KEYS.CURRENT_USER);
    const localStr = localStorage.getItem(KEYS.CURRENT_USER);
    const rawUser = sessionStr || localStr;

    // Jika tidak ada data user login, kembalikan null (TIDAK ADA AUTO LOGIN KE ADMIN)
    if (!rawUser) {
      return null;
    }

    // 2. Validasi batas waktu inaktivitas sesi
    const lastActiveStr = sessionStorage.getItem(KEYS.LAST_ACTIVITY) || localStorage.getItem(KEYS.LAST_ACTIVITY);
    const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
    const now = Date.now();

    if (lastActive > 0 && now - lastActive > SESSION_INACTIVITY_LIMIT_MS) {
      // Sesi telah kedaluwarsa karena inaktivitas
      setCurrentUser(null);
      return null;
    }

    const parsedUser: User = JSON.parse(rawUser);
    if (!parsedUser || !parsedUser.id || !parsedUser.username) {
      setCurrentUser(null);
      return null;
    }

    // Sinkronkan data terbaru dari list users jika ada perubahan profil
    const users = getUsers();
    const current = users.find((u) => u.id === parsedUser.id && u.isActive);
    if (!current) {
      // Akun tidak ada atau dinonaktifkan
      setCurrentUser(null);
      return null;
    }

    return current;
  } catch (error) {
    console.error('Error membaca sesi pengguna:', error);
    return null;
  }
}

export function setCurrentUser(user: User | null, rememberMe: boolean = false): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      // Hapus seluruh jejak sesi saat logout
      sessionStorage.removeItem(KEYS.CURRENT_USER);
      sessionStorage.removeItem(KEYS.LAST_ACTIVITY);
      sessionStorage.removeItem(KEYS.SESSION_TYPE);
      localStorage.removeItem(KEYS.CURRENT_USER);
      localStorage.removeItem(KEYS.LAST_ACTIVITY);
      localStorage.removeItem(KEYS.SESSION_TYPE);
    } else {
      const serialized = JSON.stringify(user);
      const now = String(Date.now());

      // Selalu simpan di sessionStorage untuk sesi tab saat ini
      sessionStorage.setItem(KEYS.CURRENT_USER, serialized);
      sessionStorage.setItem(KEYS.LAST_ACTIVITY, now);

      if (rememberMe) {
        // Jika "Ingat Saya" dicentang, simpan di localStorage
        localStorage.setItem(KEYS.CURRENT_USER, serialized);
        localStorage.setItem(KEYS.LAST_ACTIVITY, now);
        localStorage.setItem(KEYS.SESSION_TYPE, 'local');
      } else {
        // Sesi ketat: hapus dari localStorage agar ketika browser ditutup harus login lagi
        localStorage.removeItem(KEYS.CURRENT_USER);
        localStorage.removeItem(KEYS.LAST_ACTIVITY);
        localStorage.setItem(KEYS.SESSION_TYPE, 'session');
      }
    }
  } catch (error) {
    console.error('Error menyimpan sesi pengguna:', error);
  }
}

// ---------------- Outgoing Letters ----------------
export function getOutgoingLetters(): OutgoingLetter[] {
  return getStorageItem<OutgoingLetter[]>(KEYS.OUTGOING, INITIAL_OUTGOING_LETTERS);
}

export function saveOutgoingLetters(letters: OutgoingLetter[]): void {
  setStorageItem(KEYS.OUTGOING, letters);
}

// ---------------- Incoming Letters ----------------
export function getIncomingLetters(): IncomingLetter[] {
  return getStorageItem<IncomingLetter[]>(KEYS.INCOMING, INITIAL_INCOMING_LETTERS);
}

export function saveIncomingLetters(letters: IncomingLetter[]): void {
  setStorageItem(KEYS.INCOMING, letters);
}

// ---------------- Templates & Settings ----------------
export function getTemplates(): LetterTemplate[] {
  return getStorageItem<LetterTemplate[]>(KEYS.TEMPLATES, INITIAL_TEMPLATES);
}

export function saveTemplates(templates: LetterTemplate[]): void {
  setStorageItem(KEYS.TEMPLATES, templates);
}

export function getInstitution(): Institution {
  const inst = getStorageItem<Institution>(KEYS.INSTITUTION, INITIAL_INSTITUTION);
  if (!inst.address || inst.address.includes('Pasirkoja')) {
    const updated = { ...INITIAL_INSTITUTION };
    if (typeof window !== 'undefined') setStorageItem(KEYS.INSTITUTION, updated);
    return updated;
  }
  return inst;
}

export function saveInstitution(inst: Institution): void {
  setStorageItem(KEYS.INSTITUTION, inst);
}

export function getNumberingConfig(): NumberingConfig {
  const config = getStorageItem<NumberingConfig>(KEYS.NUMBERING, INITIAL_NUMBERING);
  if (!config.formatPattern || config.formatPattern.includes('PW-GPAnsor')) {
    const updated = { ...INITIAL_NUMBERING };
    if (typeof window !== 'undefined') setStorageItem(KEYS.NUMBERING, updated);
    return updated;
  }
  return config;
}

export function saveNumberingConfig(config: NumberingConfig): void {
  setStorageItem(KEYS.NUMBERING, config);
}

// ---------------- Notifications ----------------
export function getNotifications(): AppNotification[] {
  return getStorageItem<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
}

export function saveNotifications(notifications: AppNotification[]): void {
  setStorageItem(KEYS.NOTIFICATIONS, notifications);
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): void {
  const all = getNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: 'notif-' + Date.now(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  saveNotifications([newNotif, ...all]);
}

// ---------------- Activity Logs ----------------
export function getActivityLogs(): ActivityLog[] {
  return getStorageItem<ActivityLog[]>(KEYS.LOGS, INITIAL_LOGS);
}

export function logActivity(action: string, description: string, target: string, user?: User | null): void {
  const currentUser = user || getCurrentUser();
  if (!currentUser) return;

  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    id: 'log-' + Date.now(),
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action,
    description,
    target,
    ipAddress: '127.0.0.1 (Lokal)',
    timestamp: new Date().toISOString(),
  };

  setStorageItem(KEYS.LOGS, [newLog, ...logs.slice(0, 199)]); // keep latest 200 logs
}

// ---------------- Numbering & Date Helpers ----------------
export function getRomanMonth(monthZeroBased: number): string {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return roman[monthZeroBased] || 'I';
}

export function generateNextLetterNumber(templateCode?: string): { formattedNumber: string; seq: number } {
  const config = getNumberingConfig();
  const inst = getInstitution();
  const now = new Date();
  const currentYear = now.getFullYear();

  let nextSeq = config.currentSequence + 1;
  if (config.autoResetYearly && config.year !== currentYear) {
    nextSeq = 1;
  }

  const paddedSeq = String(nextSeq).padStart(3, '0');
  const romanMonth = getRomanMonth(now.getMonth());

  // Pattern example: {SEQ}/PW-GPAnsor/{WIL}/{ROMAN}/{YEAR}
  let result = config.formatPattern
    .replace('{SEQ}', paddedSeq)
    .replace('{WIL}', inst.regionCode || 'JB')
    .replace('{ROMAN}', romanMonth)
    .replace('{YEAR}', String(currentYear));

  return { formattedNumber: result, seq: nextSeq };
}

// Approximate Hijri conversion for Indonesian GP Ansor official correspondence
export function getApproxHijriDate(date: Date = new Date()): string {
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir',
    'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Syaban',
    'Ramadhan', 'Syawwal', 'Dzulqadah', 'Dzulhijjah'
  ];
  
  // Base reference: Oct 23, 2026 is approx 12 Rabiul Akhir 1448 H
  const refDate = new Date(2026, 9, 23).getTime(); // Oct 23, 2026
  const diffDays = Math.round((date.getTime() - refDate) / (1000 * 60 * 60 * 24));
  
  // Approx Hijri day calculation
  let day = 12 + diffDays;
  let monthIndex = 3; // Rabiul Akhir
  let year = 1448;

  while (day > 30) {
    day -= 30;
    monthIndex = (monthIndex + 1) % 12;
    if (monthIndex === 0) year++;
  }
  while (day < 1) {
    day += 29;
    monthIndex = (monthIndex - 1 + 12) % 12;
    if (monthIndex === 11) year--;
  }

  return `${day} ${hijriMonths[monthIndex]} ${year} H`;
}

export function formatIndonesianDate(dateString: string | Date): string {
  const d = new Date(dateString);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
