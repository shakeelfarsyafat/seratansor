import { LetterTemplate } from '@/types';

export interface ParsedDocxTemplate {
  name: string;
  code: string;
  category: string;
  html: string;
  rawText: string;
  fields: LetterTemplate['fields'];
  signersRequired: 'Ketua' | 'Ketua_dan_Sekretaris';
}

/**
 * Extracts human readable label from a variable key
 * e.g. 'nama_kegiatan' -> 'Nama Kegiatan'
 */
function keyToLabel(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Parses an uploaded .docx file and turns it into a LetterTemplate draft
 */
export async function parseDocxFile(file: File): Promise<ParsedDocxTemplate> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);

  const rawText = textResult.value || '';
  const html = htmlResult.value || '';

  // Clean filename for template name
  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
  const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  // Extract placeholders: {{key}}, {key}, [key]
  const placeholderRegex = /(?:\{\{|\{|\[)([\w\d_\- ]+)(?:\}\}|\}|\])/g;
  const foundKeys = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(rawText)) !== null) {
    const rawKey = match[1].trim();
    // Exclude common noise or pure numbers
    if (rawKey.length > 1 && !/^\d+$/.test(rawKey) && !['SEQ', 'ROMAN', 'YEAR', 'WIL'].includes(rawKey.toUpperCase())) {
      const normalizedKey = rawKey.toLowerCase().replace(/\s+/g, '_');
      foundKeys.add(normalizedKey);
    }
  }

  // Detect signers: check if "sekretaris" is mentioned in the signers area
  const hasSekretaris = /sekretaris/i.test(rawText);
  const signersRequired: 'Ketua' | 'Ketua_dan_Sekretaris' = hasSekretaris
    ? 'Ketua_dan_Sekretaris'
    : 'Ketua';

  // Default fields if no {{placeholder}} found
  const fields: LetterTemplate['fields'] = [];
  if (foundKeys.size > 0) {
    foundKeys.forEach((key) => {
      const isDate = /tanggal|date|tgl/i.test(key);
      const isTime = /waktu|jam|time/i.test(key);
      const isLong = /isi|agenda|detail|alasan|catatan|keterangan/i.test(key);

      fields.push({
        key,
        label: keyToLabel(key),
        type: isDate ? 'date' : isTime ? 'time' : isLong ? 'textarea' : 'text',
        required: true,
      });
    });
  } else {
    // Provide sensible default fields for general letter
    fields.push(
      { key: 'perihal', label: 'Perihal Surat', type: 'text', required: true },
      { key: 'nama_kegiatan', label: 'Nama Kegiatan / Acara', type: 'text', required: false },
      { key: 'hari_tanggal', label: 'Hari / Tanggal Pelaksanaan', type: 'text', required: false },
      { key: 'tempat', label: 'Tempat / Lokasi', type: 'text', required: false },
      { key: 'isi_surat', label: 'Isi / Keterangan Surat', type: 'textarea', required: true }
    );
  }

  // Generate 3-letter code
  const cleanCode = baseName
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 4) || 'TPL';

  return {
    name: formattedName,
    code: cleanCode,
    category: 'Word Upload',
    html,
    rawText,
    fields,
    signersRequired,
  };
}
