"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createStudentAction, createBulkStudentsAction } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building2,
  Calendar,
  ShieldCheck,
  FileText,
  HeartHandshake,
  MapPin,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  Save,
  Upload,
  Download,
} from "lucide-react";

export interface DBGroupItem {
  id: string;
  name: string;
  course: number;
  specialty?: string;
}

interface StudentRegistrationFormProps {
  userRole: string;
  dbGroups?: DBGroupItem[];
}

export interface ImportedStudentRow {
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

export function StudentRegistrationForm({ userRole, dbGroups = [] }: StudentRegistrationFormProps) {
  const router = useRouter();

  const groupsList = dbGroups.length > 0
    ? dbGroups.map((g: DBGroupItem) => g.name)
    : ["ИС-1-25", "ИС-2-24", "ПО-1-25"];

  // Registration Mode: "single" | "excel"
  const [regMode, setRegMode] = useState<"single" | "excel">("single");

  // Single Form State
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Мужской" | "Женский">("Мужской");
  const [nationalId, setNationalId] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [address, setAddress] = useState("");

  const [parentName, setParentName] = useState("");
  const [parentRelation, setParentRelation] = useState("Мать");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  const [group, setGroup] = useState(groupsList[0] || "ИС-1-25");
  const [course, setCourse] = useState("1");
  const [enrollmentType, setEnrollmentType] = useState<"Бюджет" | "Контракт">("Бюджет");
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [previousSchool, setPreviousSchool] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Excel Bulk Import State
  const [importedStudents, setImportedStudents] = useState<ImportedStudentRow[]>([]);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [defaultImportGroup, setDefaultImportGroup] = useState(groupsList[0] || "ИС-1-25");
  const [defaultImportType, setDefaultImportType] = useState<"Бюджет" | "Контракт">("Бюджет");

  // Common UI State
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Lms";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return "СТ";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!email || email.endsWith("@lyceum.edu") || email.endsWith("@student.lyceum.kg")) {
      setEmail(generateEmailFromName(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await createStudentAction({
        name: fullName.trim(),
        email: email.trim() || `${fullName.toLowerCase().split(" ")[0]}@lyceum.edu`,
        phone: phone.trim() || undefined,
        password: password || undefined,
        groupName: group,
        enrollmentType: enrollmentType,
        nationalId: nationalId.trim() || undefined,
        gender: gender,
        telegram: telegram.trim() || undefined,
        birthDate: birthDate || undefined,
      });

      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || "Ошибка при сохранении студента в БД");
        return;
      }

      setSuccessMessage(true);

      if (addAnother) {
        setFullName("");
        setEmail("");
        setPhone("");
        setTelegram("");
        setAddress("");
        setParentName("");
        setParentPhone("");
        setParentEmail("");
        setNationalId("");
        setPassword("");
        setSpecialNotes("");
        setPreviousSchool("");
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        setTimeout(() => {
          router.push("/dashboard/students");
        }, 1200);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Ошибка соединения с сервером");
    }
  };

  const normalizeKyrgyzPhone = (rawPhone: string) => {
    if (!rawPhone) return "";
    const digits = rawPhone.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("996") && digits.length === 12) {
      return `+996 (${digits.slice(3, 6)}) ${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 9) {
      return `+996 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.startsWith("0") && digits.length === 10) {
      return `+996 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return rawPhone;
  };

  const generateEmailFromName = (fullName: string) => {
    if (!fullName.trim()) return "student@lyceum.edu";
    const latin = fullName
      .trim()
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
      .replace(/[^a-z0-9\s]/g, "");

    const parts = latin.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const surname = parts[0];
      const firstname = parts[1];
      return `${firstname}.${surname}@lyceum.edu`;
    }
    return `${parts[0] || "student"}@lyceum.edu`;
  };

  const parseStudentTableText = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let headerIndices = {
      index: -1,
      name: -1,
      pin: -1,
      gender: -1,
      phone: -1,
      telegram: -1,
      birthDate: -1,
    };

    const firstLineParts = lines[0].split(/[\t,;]/).map((p) => p.trim().toLowerCase());
    const hasHeader = firstLineParts.some((p) =>
      p.includes("фио") || p.includes("студент") || p.includes("пин") || p.includes("телефон") || p.includes("пол") || p.includes("дата") || p.includes("telegram")
    );

    let startLine = 0;
    if (hasHeader) {
      startLine = 1;
      firstLineParts.forEach((p, idx) => {
        if (p.includes("№") || p === "no" || p === "n") headerIndices.index = idx;
        else if (p.includes("фио") || p.includes("студент") || p.includes("имя")) headerIndices.name = idx;
        else if (p.includes("пин") || p.includes("инн")) headerIndices.pin = idx;
        else if (p.includes("пол") && !p.includes("телефон")) headerIndices.gender = idx;
        else if (p.includes("тел") || p.includes("телефон") || p.includes("мобильн")) headerIndices.phone = idx;
        else if (p.includes("telegram") || p.includes("whatsapp") || p.includes("мессенджер") || p.includes("телеграм")) headerIndices.telegram = idx;
        else if (p.includes("рождения") || p.includes("д.р") || p.includes("дата")) headerIndices.birthDate = idx;
      });
    }

    const parsedRows: ImportedStudentRow[] = [];

    for (let i = startLine; i < lines.length; i++) {
      const parts = lines[i].split(/[\t,;]/).map((p) => p.trim());
      if (parts.length < 2) continue;

      let name = "";
      let pin = "";
      let gender = "";
      let phone = "";
      let telegram = "";
      let birthDate = "";
      let email = "";

      if (hasHeader) {
        if (headerIndices.name !== -1) name = parts[headerIndices.name] || "";
        if (headerIndices.pin !== -1) pin = parts[headerIndices.pin] || "";
        if (headerIndices.gender !== -1) gender = parts[headerIndices.gender] || "";
        if (headerIndices.phone !== -1) phone = parts[headerIndices.phone] || "";
        if (headerIndices.telegram !== -1) telegram = parts[headerIndices.telegram] || "";
        if (headerIndices.birthDate !== -1) birthDate = parts[headerIndices.birthDate] || "";
      } else {
        let idx = 0;
        if (/^\d{1,3}$/.test(parts[0])) idx = 1;

        name = parts[idx] || "";
        pin = parts[idx + 1] || "";
        gender = parts[idx + 2] || "";
        phone = parts[idx + 3] || "";
        telegram = parts[idx + 4] || "";
        birthDate = parts[idx + 5] || "";
      }

      if (!name || name.toLowerCase().includes("фио") || name.toLowerCase().includes("студент")) continue;

      const formattedPhone = normalizeKyrgyzPhone(phone);
      const finalEmail = generateEmailFromName(name);
      const autoPassword = "Lms" + (Math.floor(100000 + Math.random() * 900000)).toString();

      parsedRows.push({
        id: `imp-${i}-${Date.now()}`,
        fullName: name,
        nationalId: pin,
        gender: gender || (name.endsWith("вна") || name.endsWith("ева") || name.endsWith("ова") || name.endsWith("кызы") ? "Женский" : "Мужской"),
        phone: formattedPhone,
        telegram: telegram !== "—" ? telegram : "",
        birthDate: birthDate,
        email: finalEmail,
        password: autoPassword,
        group: defaultImportGroup,
        enrollmentType: defaultImportType,
      });
    }

    if (parsedRows.length > 0) {
      setImportedStudents(parsedRows);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);

    try {
      const text = await file.text();
      parseStudentTableText(text);
    } catch (err) {
      setErrorMessage("Не удалось прочитать файл");
    }
  };

  const handleDownloadPasswordsCSV = () => {
    if (importedStudents.length === 0) return;
    let csvContent = "\uFEFF№,ФИО Студента,Логин (Email),Временный Пароль\n";
    importedStudents.forEach((st, idx) => {
      csvContent += `${idx + 1},"${st.fullName}","${st.email}","${st.password || 'Lms123456'}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `loginy_i_paroli_${defaultImportGroup || "gruppy"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "\uFEFF" +
      "№,ФИО Студента,ПИН КР,Пол,Телефон,Telegram / WhatsApp,Дата рождения\n" +
      '1,"Абдыкадыров Бекзат Дурусбекович","20707200900462","Мужской","+996 703 070 029","703070029","07.07.2009"\n' +
      '2,"Алмазбеков Асылбек Алмазбекович","22502200900165","Мужской","+996 225 547 154","+996 225 547 154","25.02.2009"\n' +
      '3,"Анарбаев Каниет Рустамович","21705201100139","Мужской","0703 032 335","—","17.05.2011"\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "shablon_vedomosti_studentov.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadDemoData = () => {
    setExcelFileName("spisok_kursantov_2026.xlsx");
    setImportedStudents([
      { id: "imp-1", fullName: "Абдыкадыров Бекзат Дурусбекович", nationalId: "20707200900462", gender: "Мужской", phone: "+996 703 070 029", telegram: "703070029", birthDate: "07.07.2009", email: "bekzat.abdykadyrov@lyceum.edu", password: "Lms" + Math.floor(100000 + Math.random() * 900000), group: defaultImportGroup, enrollmentType: defaultImportType },
      { id: "imp-2", fullName: "Алмазбеков Асылбек Алмазбекович", nationalId: "22502200900165", gender: "Мужской", phone: "+996 225 547 154", telegram: "+996 225 547 154", birthDate: "25.02.2009", email: "asylbek.almazbekov@lyceum.edu", password: "Lms" + Math.floor(100000 + Math.random() * 900000), group: defaultImportGroup, enrollmentType: defaultImportType },
      { id: "imp-3", fullName: "Анарбаев Каниет Рустамович", nationalId: "21705201100139", gender: "Мужской", phone: "0703 032 335", telegram: "—", birthDate: "17.05.2011", email: "kaniet.anarbaev@lyceum.edu", password: "Lms" + Math.floor(100000 + Math.random() * 900000), group: defaultImportGroup, enrollmentType: defaultImportType },
      { id: "imp-4", fullName: "Анарбеков Шернияз Алтынбекович", nationalId: "21208201000077", gender: "Мужской", phone: "—", telegram: "—", birthDate: "12.08.2010", email: "sherniyaz.anarbekov@lyceum.edu", password: "Lms" + Math.floor(100000 + Math.random() * 900000), group: defaultImportGroup, enrollmentType: defaultImportType },
      { id: "imp-5", fullName: "Арстанбеков Асылбек", nationalId: "20401201101004", gender: "Мужской", phone: "+996 221 262 711", telegram: "@Asyl_prog", birthDate: "04.01.2011", email: "asylbek.arstanbekov@lyceum.edu", password: "Lms" + Math.floor(100000 + Math.random() * 900000), group: defaultImportGroup, enrollmentType: defaultImportType },
      { id: "imp-6", fullName: "Арынбаева Бегимай Манасбековна", nationalId: "10306200950246", gender: "Женский", phone: "0507 924 223", telegram: "0709 699 705", birthDate: "03.06.2009", email: "begimay.arynbaeva@lyceum.edu", password: "Lms" + Math.floor(100000 + Math.random() * 900000), group: defaultImportGroup, enrollmentType: defaultImportType },
    ]);
  };

  const handleRemoveImportRow = (id: string) => {
    setImportedStudents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBatchImportSubmit = async () => {
    if (importedStudents.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = importedStudents.map((st) => ({
        name: st.fullName,
        email: st.email,
        phone: st.phone,
        password: st.password,
        groupName: st.group,
        enrollmentType: st.enrollmentType,
        nationalId: st.nationalId,
        gender: st.gender,
        telegram: st.telegram,
        birthDate: st.birthDate,
      }));

      const res = await createBulkStudentsAction(payload);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || "Ошибка при массовом зачислении в БД");
        return;
      }

      setSuccessMessage(true);
      setTimeout(() => {
        router.push("/dashboard/students");
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Ошибка соединения с сервером");
    }
  };

  return (
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <Breadcrumb className="mb-1">
            <BreadcrumbList className="text-[10px]">
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Главная</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/students">Студенты</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Регистрация</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Регистрация студентов
            </h1>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
              Зачисление
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students" />}>
            <ArrowLeft className="h-3.5 w-3.5" /> Назад к списку
          </Button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs w-fit">
        <button
          type="button"
          onClick={() => setRegMode("single")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors font-medium ${
            regMode === "single"
              ? "bg-background border border-border shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          <span>Анкета одного студента</span>
        </button>
        <button
          type="button"
          onClick={() => setRegMode("excel")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors font-medium ${
            regMode === "excel"
              ? "bg-background border border-border shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Массовый импорт из Excel</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <Button size="xs" variant="ghost" className="h-6 text-[10px]" onClick={() => setErrorMessage(null)}>
            Закрыть
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-semibold">
              {regMode === "single" ? "Студент успешно зарегистрирован!" : `Импортировано студентов: ${importedStudents.length}!`}
            </span>
          </div>
          <Button size="xs" variant="outline" className="h-6 text-[10px]" onClick={() => router.push("/dashboard/students")}>
            К списку
          </Button>
        </div>
      )}

      {/* MODE 1: Single Student Form */}
      {regMode === "single" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={(e) => handleSubmit(e, false)} className="lg:col-span-2 space-y-4">
            
            {/* Section 1: Personal Info */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-primary" /> Личные данные
                </span>
                <span className="text-[10px] text-muted-foreground">Основные сведения</span>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-medium text-foreground text-xs">
                    ФИО студента (полностью) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="Фамилия Имя Отчество"
                    value={fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" /> Дата рождения
                  </label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">Пол</label>
                  <Select value={gender} onValueChange={(val: "Мужской" | "Женский") => setGender(val)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue>{gender}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Мужской" className="text-xs">Мужской</SelectItem>
                      <SelectItem value="Женский" className="text-xs">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-medium text-foreground text-xs flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-muted-foreground" /> ПИН / ИИН / Паспорт
                  </label>
                  <Input
                    placeholder="20105200501234"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Info */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Контактные данные
                </span>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="student@lyceum.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" /> Телефон
                  </label>
                  <Input
                    type="tel"
                    placeholder="+996 555 12-34-56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">Telegram / WhatsApp (Соцсети)</label>
                  <Input
                    placeholder="@username или +996 703 070 029"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" /> Адрес
                  </label>
                  <Input
                    placeholder="г. Бишкек"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Academic & Group */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> Академические данные
                </span>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">
                    Группа <span className="text-destructive">*</span>
                  </label>
                  <Select value={group} onValueChange={(val) => {
                    setGroup(val);
                    if (val === "ИС-2-24") setCourse("2");
                    else setCourse("1");
                  }}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue>{group}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {groupsList.map((gName: string) => (
                        <SelectItem key={gName} value={gName} className="text-xs">
                          {gName}
                        </SelectItem>
                      ))}
                      <SelectItem value="Не распределен" className="text-xs">Не распределен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">Форма обучения</label>
                  <Select
                    value={enrollmentType}
                    onValueChange={(val: "Бюджет" | "Контракт") => setEnrollmentType(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue>{enrollmentType}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Бюджет" className="text-xs">Бюджетная основа</SelectItem>
                      <SelectItem value="Контракт" className="text-xs">Контрактная основа</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 4: Security */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" /> Авторизационные данные
                </span>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3" /> Сгенерировать пароль
                </button>
              </div>
              <div className="p-3 space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">Временный пароль *</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Придумайте пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-8 text-xs pr-16 font-mono"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleCopyPassword}
                      >
                        {copiedPassword ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="xs" className="h-8 text-xs" onClick={() => router.push("/dashboard/students")}>
                Отмена
              </Button>
              <Button size="xs" type="submit" disabled={isSubmitting || !fullName.trim()} className="h-8 text-xs gap-1.5">
                <Save className="h-3.5 w-3.5" /> {isSubmitting ? "Сохранение..." : "Зарегистрировать"}
              </Button>
            </div>
          </form>

          {/* Right Column Preview Widget */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-3.5 space-y-3 text-xs sticky top-4">
              <div className="text-xs font-bold text-foreground border-b pb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Предпросмотр профиля
              </div>

              <div className="flex flex-col items-center text-center space-y-2 py-2">
                <Avatar className="h-14 w-14 border shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-xs text-foreground line-clamp-1">
                    {fullName.trim() || "Фамилия Имя Отчество"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {email || "student@lyceum.edu"}
                  </p>
                </div>

                <div className="flex items-center gap-1 pt-1">
                  <Badge variant="default" className="text-[9px] px-1.5 py-0 font-medium">
                    {group}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                    {enrollmentType}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Excel Bulk Import Mode */}
      {regMode === "excel" && (
        <div className="rounded-xl border bg-card p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Загрузка списка из Excel / CSV
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Быстрое зачисление всей группы по готовой ведомости
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="xs" variant="ghost" onClick={handleLoadDemoData} className="h-8 text-xs gap-1 text-primary hover:bg-primary/10 font-medium">
                <Sparkles className="h-3.5 w-3.5" /> Пример данных
              </Button>
              <Button size="xs" variant="outline" onClick={handleDownloadTemplate} className="h-8 text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Скачать шаблон CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Целевая группа для списка</label>
              <Select value={defaultImportGroup} onValueChange={(val) => val && setDefaultImportGroup(val)}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue>{defaultImportGroup}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {groupsList.map((gName: string) => (
                    <SelectItem key={gName} value={gName} className="text-xs">
                      {gName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Форма обучения</label>
              <Select value={defaultImportType} onValueChange={(val: "Бюджет" | "Контракт") => setDefaultImportType(val)}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue>{defaultImportType}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Бюджет" className="text-xs">Бюджетная основа</SelectItem>
                  <SelectItem value="Контракт" className="text-xs">Контрактная основа</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-xs text-foreground">1. Загрузите файл таблицы (.csv, .txt, .xlsx)</label>
              <label className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all bg-card text-center relative">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground">
                    {excelFileName ? (
                      <span className="text-primary font-bold flex items-center gap-1 justify-center">
                        <FileSpreadsheet className="h-3.5 w-3.5" /> {excelFileName}
                      </span>
                    ) : (
                      "Выберите файл экспортной ведомости на компьютере"
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-0.5">
                    Автоматически распознает столбцы: №, ФИО Студента, ПИН КР, Пол, Телефон, Telegram / WhatsApp, Дата рождения
                  </div>
                </div>
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-xs text-foreground">Или вставьте скопированный текст из Excel / Таблицы:</label>
              <textarea
                rows={3}
                placeholder="Вставьте скопированные строки из другой системы (Ctrl+V)..."
                onChange={(e) => parseStudentTableText(e.target.value)}
                className="w-full p-2.5 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {importedStudents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">
                  Распознано записей: {importedStudents.length}
                </span>
              </div>

              <div className="border rounded-lg overflow-x-auto bg-background">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-8">№</th>
                      <th className="py-2 px-2.5 min-w-[180px]">ФИО Студента</th>
                      <th className="py-2 px-2.5 min-w-[120px]">ПИН КР</th>
                      <th className="py-2 px-2.5">Пол</th>
                      <th className="py-2 px-2.5 min-w-[120px]">Телефон</th>
                      <th className="py-2 px-2.5 min-w-[120px]">Telegram / WhatsApp</th>
                      <th className="py-2 px-2.5">Дата рождения</th>
                      <th className="py-2 px-2.5">Пароль</th>
                      <th className="py-2 px-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {importedStudents.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-muted/20">
                        <td className="py-2 px-2.5 text-center text-muted-foreground font-mono text-[10px]">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-medium text-foreground">
                          {st.fullName}
                          <div className="text-[10px] text-muted-foreground font-mono">{st.email}</div>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px] text-muted-foreground">{st.nationalId || "—"}</td>
                        <td className="py-2 px-2.5 text-muted-foreground">{st.gender || "—"}</td>
                        <td className="py-2 px-2.5 font-mono text-[11px]">{st.phone || "—"}</td>
                        <td className="py-2 px-2.5 text-muted-foreground">{st.telegram || "—"}</td>
                        <td className="py-2 px-2.5 text-muted-foreground font-mono text-[11px]">{st.birthDate || "—"}</td>
                        <td className="py-2 px-2.5">
                          <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary bg-primary/5">
                            {st.password || "Lms123456"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2.5 text-right">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleRemoveImportRow(st.id)}
                            className="text-muted-foreground hover:text-destructive h-6 w-6"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleDownloadPasswordsCSV}
                  className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10 font-medium"
                >
                  <Download className="h-3.5 w-3.5" /> Скачать логины и пароли (.csv)
                </Button>

                <div className="flex items-center gap-2">
                  <Button size="xs" variant="outline" onClick={() => setImportedStudents([])} className="h-8 text-xs">
                    Очистить
                  </Button>
                  <Button size="xs" onClick={handleBatchImportSubmit} disabled={isSubmitting} className="h-8 text-xs gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Зачислить всех ({importedStudents.length})
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
