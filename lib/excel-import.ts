import * as XLSX from "xlsx";

export interface ParsedStudentRow {
  id: string;
  fullName: string;
  nationalId?: string;
  gender?: string;
  phone?: string;
  telegram?: string;
  birthDate?: string;
  email: string;
  password?: string;
  group: string;
  enrollmentType: "Бюджет" | "Контракт";
}

export interface ParseExcelResult {
  students: ParsedStudentRow[];
  detectedGroup?: string;
  sheetNames: string[];
}

export interface ParsedStaffRow {
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER";
  phone?: string;
}

/**
 * Transliterates Russian and Kyrgyz names to clean Latin for emails.
 */
export function transliterateToLatin(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/а/g, "a").replace(/б/g, "b").replace(/в/g, "v").replace(/г/g, "g")
    .replace(/д/g, "d").replace(/е/g, "e").replace(/ё/g, "yo").replace(/ж/g, "zh")
    .replace(/з/g, "z").replace(/и/g, "i").replace(/й/g, "y").replace(/к/g, "k")
    .replace(/л/g, "l").replace(/м/g, "m").replace(/н/g, "n").replace(/о/g, "o")
    .replace(/п/g, "p").replace(/р/g, "r").replace(/с/g, "s").replace(/т/g, "t")
    .replace(/у/g, "u").replace(/ф/g, "f").replace(/х/g, "kh").replace(/ц/g, "ts")
    .replace(/ч/g, "ch").replace(/ш/g, "sh").replace(/щ/g, "shch").replace(/ъ/g, "")
    .replace(/ы/g, "y").replace(/ь/g, "").replace(/э/g, "e").replace(/ю/g, "yu")
    .replace(/я/g, "ya")
    // Kyrgyz specific characters
    .replace(/ң/g, "n").replace(/ө/g, "o").replace(/ү/g, "u")
    .replace(/[^a-z0-9\s]/g, "");
}

/**
 * Generates an email address from full name (e.g. "Бекзат Абдыкадыров" -> "bekzat.abdykadyrov@lyceum.edu", "Нурлан кызы Айбийке" -> "aibiyke.nurlan@lyceum.edu")
 */
export function generateEmailFromName(fullName: string, existingEmails?: Set<string>): string {
  if (!fullName || !fullName.trim()) return "student@lyceum.edu";

  const latin = transliterateToLatin(fullName.trim());
  const parts = latin.split(/\s+/).filter(Boolean);

  let baseEmail = "student";
  if (parts.length >= 3) {
    // Check if middle word is kyzy, uulu, or tegin (e.g. "Nurlan kyzy Aibiyke")
    if (parts[1] === "kyzy" || parts[1] === "uulu" || parts[1] === "tegin") {
      const father = parts[0];
      const givenName = parts[2];
      baseEmail = `${givenName}.${father}`;
    } else if (parts[2] === "kyzy" || parts[2] === "uulu" || parts[2] === "tegin") {
      // E.g. "Aibiyke Nurlan kyzy"
      const givenName = parts[0];
      const father = parts[1];
      baseEmail = `${givenName}.${father}`;
    } else {
      // Standard "Abdykadyrov Bekzat Durusbekovich" -> firstname.surname
      const surname = parts[0];
      const firstname = parts[1];
      baseEmail = `${firstname}.${surname}`;
    }
  } else if (parts.length === 2) {
    const surname = parts[0];
    const firstname = parts[1];
    baseEmail = `${firstname}.${surname}`;
  } else if (parts.length === 1) {
    baseEmail = parts[0];
  }

  let finalEmail = `${baseEmail}@lyceum.edu`;
  if (existingEmails) {
    let counter = 2;
    while (existingEmails.has(finalEmail)) {
      finalEmail = `${baseEmail}${counter}@lyceum.edu`;
      counter++;
    }
    existingEmails.add(finalEmail);
  }

  return finalEmail;
}

/**
 * Normalizes phone numbers to standard format: +996 (XXX) XX-XX-XX or clean international format
 */
export function normalizeKyrgyzPhone(rawPhone: any): string {
  if (!rawPhone) return "";
  const str = String(rawPhone).trim();
  if (str === "—" || str === "-" || str.toLowerCase() === "null") return "";

  const digits = str.replace(/\D/g, "");
  if (!digits) return str;

  if (digits.startsWith("996") && digits.length === 12) {
    return `+996 (${digits.slice(3, 6)}) ${digits.slice(6, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`;
  }
  if (digits.length === 9) {
    return `+996 (${digits.slice(0, 3)}) ${digits.slice(3, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+996 (${digits.slice(1, 4)}) ${digits.slice(4, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }

  return str;
}

/**
 * Formats dates from Date objects, Excel serial numbers, or date strings into DD.MM.YYYY
 */
export function parseDateCell(val: any): string {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const day = String(val.getDate()).padStart(2, "0");
    const month = String(val.getMonth() + 1).padStart(2, "0");
    const year = val.getFullYear();
    return `${day}.${month}.${year}`;
  }
  if (typeof val === "number" && val > 20000 && val < 65000) {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}.${month}.${year}`;
  }

  const str = String(val).trim();
  if (str === "—" || str === "-") return "";

  // Check DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, "0")}.${dmyMatch[2].padStart(2, "0")}.${dmyMatch[3]}`;
  }

  // Check YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\.\/\-](\d{1,2})[\.\/\-](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[3].padStart(2, "0")}.${ymdMatch[2].padStart(2, "0")}.${ymdMatch[1]}`;
  }

  return str;
}

/**
 * Formats Kyrgyz National PIN (14 digits) or passport number
 */
export function parsePinCell(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    // Avoid scientific notation for 14 digit numbers
    return Math.floor(val).toString();
  }
  const str = String(val).replace(/\.0$/, "").trim();
  if (str === "—" || str === "-") return "";
  return str;
}

/**
 * Extracts possible group name from filename or sheet title
 * e.g. "Список_группы_ВР-2-26.xlsx" -> "ВР-2-26"
 */
export function extractGroupFromFilename(filename: string, availableGroups: string[] = []): string | null {
  if (!filename) return null;
  const cleanName = filename.replace(/\.[^/.]+$/, "");

  // 1. Direct match with available groups
  for (const grp of availableGroups) {
    if (cleanName.toLowerCase().includes(grp.toLowerCase())) {
      return grp;
    }
  }

  // 2. Extract group code pattern like "ВР-2-26", "ИС-1-25", "ПО-2-24"
  const match = cleanName.match(/(?:список[_\s-]*(?:группы)?[_\s-]*|группа[_\s-]*)?([А-Яа-яA-Za-z0-9]+[_\-][0-9]+[_\-][0-9]+|[А-Яа-яA-Za-z0-9]+[_\-][0-9]+)/i);
  if (match && match[1]) {
    return match[1].replace(/_/g, "-").toUpperCase();
  }

  return null;
}

/**
 * Parses 2D array of rows from Excel or CSV sheet into structured student records.
 */
export function parseStudentRowsFrom2DArray(
  rawRows: any[][],
  defaultGroup: string,
  defaultType: "Бюджет" | "Контракт" = "Бюджет",
  detectedGroup?: string
): ParsedStudentRow[] {
  if (!rawRows || rawRows.length === 0) return [];

  // 1. Locate the header row (search first 15 rows)
  let headerRowIndex = -1;
  const headerMap = {
    index: -1,
    name: -1,
    pin: -1,
    gender: -1,
    phone: -1,
    telegram: -1,
    birthDate: -1,
    group: -1,
    email: -1,
    enrollmentType: -1,
  };

  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    const rowStrings = row.map((c) => String(c || "").trim().toLowerCase());
    const hasHeaderKeywords = rowStrings.some(
      (cell) =>
        cell.includes("фио") ||
        cell.includes("студент") ||
        cell.includes("аты-жөнү") ||
        cell.includes("аты жөнү") ||
        cell.includes("имя") ||
        cell.includes("фамилия") ||
        cell.includes("пин") ||
        cell.includes("инн") ||
        cell.includes("пол") ||
        cell.includes("жынысы") ||
        cell.includes("телефон") ||
        cell.includes("telegram") ||
        cell.includes("рождения") ||
        cell.includes("туулган")
    );

    if (hasHeaderKeywords) {
      headerRowIndex = r;
      rowStrings.forEach((cell, colIdx) => {
        if (cell.includes("№") || cell === "no" || cell === "n" || cell === "п/п" || cell === "№ п/п") {
          headerMap.index = colIdx;
        } else if (
          cell.includes("фио") ||
          cell.includes("студент") ||
          cell.includes("аты-жөнү") ||
          cell.includes("аты жөнү") ||
          cell.includes("имя") ||
          cell.includes("фамилия") ||
          cell.includes("full name") ||
          cell.includes("fio")
        ) {
          headerMap.name = colIdx;
        } else if (cell.includes("пин") || cell.includes("инн") || cell.includes("паспорт") || cell.includes("id")) {
          headerMap.pin = colIdx;
        } else if ((cell.includes("пол") || cell.includes("жынысы") || cell.includes("gender")) && !cell.includes("телефон")) {
          headerMap.gender = colIdx;
        } else if (cell.includes("тел") || cell.includes("phone") || cell.includes("моб") || cell.includes("байланыш")) {
          headerMap.phone = colIdx;
        } else if (cell.includes("telegram") || cell.includes("whatsapp") || cell.includes("вотсап") || cell.includes("телеграм") || cell.includes("тг") || cell.includes("мессенджер")) {
          headerMap.telegram = colIdx;
        } else if (cell.includes("рождения") || cell.includes("туулган") || cell.includes("д.р") || cell.includes("д/р") || cell.includes("дата")) {
          headerMap.birthDate = colIdx;
        } else if (cell.includes("группа") || cell.includes("тайпа") || cell.includes("group") || cell.includes("класс")) {
          headerMap.group = colIdx;
        } else if (cell.includes("email") || cell.includes("почта") || cell.includes("mail")) {
          headerMap.email = colIdx;
        } else if (cell.includes("форма") || cell.includes("основа") || cell.includes("бюджет") || cell.includes("контракт")) {
          headerMap.enrollmentType = colIdx;
        }
      });
      break;
    }
  }

  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
  const parsedStudents: ParsedStudentRow[] = [];
  const existingEmails = new Set<string>();

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Filter out rows that are entirely empty
    const rowText = row.map((c) => String(c || "").trim()).join("");
    if (!rowText) continue;

    // Skip XML or stylesheet tags accidentally caught
    if (rowText.includes("<?xml") || rowText.includes("<styleSheet") || rowText.includes("xmlns:")) continue;

    let rawName = "";
    let rawPin = "";
    let rawGender = "";
    let rawPhone = "";
    let rawTelegram = "";
    let rawBirthDate = "";
    let rawGroup = "";
    let rawEmail = "";
    let rawType = "";

    if (headerRowIndex !== -1 && headerMap.name !== -1) {
      rawName = row[headerMap.name] != null ? String(row[headerMap.name]).trim() : "";
      rawPin = headerMap.pin !== -1 && row[headerMap.pin] != null ? parsePinCell(row[headerMap.pin]) : "";
      rawGender = headerMap.gender !== -1 && row[headerMap.gender] != null ? String(row[headerMap.gender]).trim() : "";
      rawPhone = headerMap.phone !== -1 && row[headerMap.phone] != null ? normalizeKyrgyzPhone(row[headerMap.phone]) : "";
      rawTelegram = headerMap.telegram !== -1 && row[headerMap.telegram] != null ? String(row[headerMap.telegram]).trim() : "";
      rawBirthDate = headerMap.birthDate !== -1 && row[headerMap.birthDate] != null ? parseDateCell(row[headerMap.birthDate]) : "";
      rawGroup = headerMap.group !== -1 && row[headerMap.group] != null ? String(row[headerMap.group]).trim() : "";
      rawEmail = headerMap.email !== -1 && row[headerMap.email] != null ? String(row[headerMap.email]).trim() : "";
      rawType = headerMap.enrollmentType !== -1 && row[headerMap.enrollmentType] != null ? String(row[headerMap.enrollmentType]).trim() : "";
    } else {
      // Fallback column indexing
      let offset = 0;
      if (/^\d{1,3}$/.test(String(row[0]).trim())) {
        offset = 1;
      }
      rawName = String(row[offset] || "").trim();
      rawPin = parsePinCell(row[offset + 1]);
      rawGender = String(row[offset + 2] || "").trim();
      rawPhone = normalizeKyrgyzPhone(row[offset + 3]);
      rawTelegram = String(row[offset + 4] || "").trim();
      rawBirthDate = parseDateCell(row[offset + 5]);
    }

    // Skip invalid rows (header text re-encountered or non-student rows)
    const lowerName = rawName.toLowerCase();
    if (
      !rawName ||
      rawName.length < 3 ||
      lowerName.includes("фио") ||
      lowerName.includes("студент") ||
      lowerName.includes("итого") ||
      lowerName.includes("куратор") ||
      lowerName.includes("ведомость") ||
      lowerName.includes("министерство") ||
      lowerName.includes("<stylesheet")
    ) {
      continue;
    }

    // Determine Gender
    let finalGender = "Мужской";
    if (
      rawGender.toLowerCase().startsWith("ж") ||
      rawGender.toLowerCase().startsWith("f") ||
      rawGender.toLowerCase().includes("жен")
    ) {
      finalGender = "Женский";
    } else if (
      rawGender.toLowerCase().startsWith("м") ||
      rawGender.toLowerCase().startsWith("m") ||
      rawGender.toLowerCase().includes("муж")
    ) {
      finalGender = "Мужской";
    } else {
      // Infer gender by Kyrgyz/Russian naming patronymic / endings
      const lower = rawName.toLowerCase();
      if (
        lower.endsWith("вна") ||
        lower.endsWith("ева") ||
        lower.endsWith("ова") ||
        lower.endsWith("кызы") ||
        lower.includes(" кызы") ||
        lower.endsWith("ай") ||
        lower.endsWith("гүл") ||
        lower.endsWith("нур")
      ) {
        finalGender = "Женский";
      }
    }

    // Email generation or fallback
    let finalEmail = rawEmail;
    if (!finalEmail || !finalEmail.includes("@")) {
      finalEmail = generateEmailFromName(rawName, existingEmails);
    }

    // Random strong initial password
    const autoPassword = "Lms" + Math.floor(100000 + Math.random() * 900000).toString();

    // Group assignment
    const targetGroup = rawGroup || detectedGroup || defaultGroup || "ИС-1-25";

    // Enrollment type
    let finalType: "Бюджет" | "Контракт" = defaultType;
    if (rawType.toLowerCase().includes("контракт")) {
      finalType = "Контракт";
    } else if (rawType.toLowerCase().includes("бюджет")) {
      finalType = "Бюджет";
    }

    parsedStudents.push({
      id: `imp-${r}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: rawName,
      nationalId: rawPin || undefined,
      gender: finalGender,
      phone: rawPhone || undefined,
      telegram: rawTelegram && rawTelegram !== "—" && rawTelegram !== "-" ? rawTelegram : undefined,
      birthDate: rawBirthDate || undefined,
      email: finalEmail,
      password: autoPassword,
      group: targetGroup,
      enrollmentType: finalType,
    });
  }

  return parsedStudents;
}

/**
 * Main parser function to handle uploaded File (.xlsx, .xls, .csv, .tsv, .txt)
 */
export async function parseExcelOrTableFile(
  file: File,
  availableGroups: string[] = [],
  defaultGroup: string = "ИС-1-25",
  defaultType: "Бюджет" | "Контракт" = "Бюджет"
): Promise<ParseExcelResult> {
  const fileName = file.name || "";
  const detectedGroup = extractGroupFromFilename(fileName, availableGroups) || undefined;

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    raw: false,
    dateNF: "dd.mm.yyyy",
  });

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    return { students: [], detectedGroup, sheetNames: [] };
  }

  // Use first sheet
  const firstSheetName = sheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const students = parseStudentRowsFrom2DArray(
    rawRows,
    detectedGroup || defaultGroup,
    defaultType,
    detectedGroup
  );

  return {
    students,
    detectedGroup,
    sheetNames,
  };
}

/**
 * Parses raw text pasted from clipboard / textarea
 */
export function parseRawStudentText(
  text: string,
  defaultGroup: string = "ИС-1-25",
  defaultType: "Бюджет" | "Контракт" = "Бюджет"
): ParsedStudentRow[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rawRows: string[][] = lines.map((line) => {
    // Split by tab, semicolon, or comma (respecting quotes)
    if (line.includes("\t")) {
      return line.split("\t").map((c) => c.trim());
    }
    if (line.includes(";")) {
      return line.split(";").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    }
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
  });

  return parseStudentRowsFrom2DArray(rawRows, defaultGroup, defaultType);
}

/**
 * Parses staff / teacher Excel or CSV file
 */
export async function parseStaffFile(file: File): Promise<ParsedStaffRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const parsedStaff: ParsedStaffRow[] = [];

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rowText = row.map((c) => String(c || "").trim()).join(" ");
    if (!rowText || rowText.toLowerCase().includes("фио") || rowText.includes("<styleSheet")) continue;

    const name = String(row[0] || "").trim();
    const email = String(row[1] || "").trim();
    let roleInput = String(row[2] || "").trim().toUpperCase();
    const phone = row[3] != null ? normalizeKyrgyzPhone(row[3]) : undefined;

    let role: "ADMIN" | "TEACHER" = "TEACHER";
    if (roleInput.includes("ADMIN") || roleInput.includes("АДМИН")) {
      role = "ADMIN";
    }

    if (name && email.includes("@")) {
      parsedStaff.push({ name, email, role, phone });
    }
  }

  return parsedStaff;
}
