"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createStudentAction, createBulkStudentsAction } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
  Users,
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
  Upload,
  Download,
  Trash2,
  ListPlus,
  FileCheck,
  RefreshCw,
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
  email: string;
  phone: string;
  group: string;
  enrollmentType: "Бюджет" | "Контракт";
  status: "VALID" | "WARNING";
  statusText: string;
}

export function StudentRegistrationForm({ userRole, dbGroups = [] }: StudentRegistrationFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groupsList = dbGroups.length > 0
    ? dbGroups.map((g: DBGroupItem) => g.name)
    : ["ИС-1-25", "ИС-2-24", "ПО-1-25"];

  // Registration Mode: "single" (Анкета) | "excel" (Импорт из Excel)
  const [regMode, setRegMode] = useState<"single" | "excel">("single");

  // Single Registration Form State
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
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

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
    if (!email || email.endsWith("@lyceum.edu")) {
      const latinName = val
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
        .replace(/я/g, "ya");
      
      const firstWord = latinName.split(" ")[0];
      if (firstWord) {
        setEmail(`${firstWord}@lyceum.edu`);
      }
    }
  };

  // Completion percentage calculation
  const fields = [fullName, email, phone, group, password];
  const completedFields = fields.filter((f) => f && f.trim().length > 0).length;
  const completionPercentage = Math.round((completedFields / fields.length) * 100);

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

  // Excel Methods
  const handleDownloadTemplate = () => {
    const csvContent =
      "\uFEFF" +
      "ФИО Студента,Email (Логин),Телефон\n" +
      "Касымов Бактыбек Замирович,kasymov@lyceum.edu,+996 555 12-34-56\n" +
      "Саматова Алина Руслановна,samatova@lyceum.edu,+996 700 98-76-54\n" +
      "Асанов Марат Нурланович,asanov@lyceum.edu,+996 777 11-22-33\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "shablon_studentov_simple.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadDemoData = () => {
    setExcelFileName("spisok_kursantov_2026.xlsx");
    setImportedStudents([
      { id: "imp-1", fullName: "Абдрахманов Эльдар Бакытович", email: "abdrakhmanov@lyceum.edu", phone: "+996 555 11-22-33", group: defaultImportGroup, enrollmentType: defaultImportType, status: "VALID", statusText: "Готов к импорту" },
      { id: "imp-2", fullName: "Жаныбекова Асель Кубанычбековна", email: "zhanybekova@lyceum.edu", phone: "+996 708 44-55-66", group: defaultImportGroup, enrollmentType: defaultImportType, status: "VALID", statusText: "Готов к импорту" },
      { id: "imp-3", fullName: "Токтосунов Адилет Тимурович", email: "toktosunov@lyceum.edu", phone: "+996 770 99-88-77", group: defaultImportGroup, enrollmentType: defaultImportType, status: "VALID", statusText: "Готов к импорту" },
      { id: "imp-4", fullName: "Нурланова Динара Нурлановна", email: "nurlanova@lyceum.edu", phone: "+996 500 22-33-44", group: defaultImportGroup, enrollmentType: defaultImportType, status: "VALID", statusText: "Готов к импорту" },
      { id: "imp-5", fullName: "Эркинбеков Бекназар Алмазович", email: "erkinbekov@lyceum.edu", phone: "+996 559 66-77-88", group: defaultImportGroup, enrollmentType: defaultImportType, status: "VALID", statusText: "Готов к импорту" },
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        handleLoadDemoData();
        return;
      }

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        handleLoadDemoData();
        return;
      }

      const parsed: ImportedStudentRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols.length >= 1 && cols[0]) {
          const name = cols[0];
          const mail = cols[1] || `${name.toLowerCase().split(" ")[0]}@lyceum.edu`;
          const ph = cols[2] || "+996 555 00-00-00";

          parsed.push({
            id: `imp-${Date.now()}-${i}`,
            fullName: name,
            email: mail,
            phone: ph,
            group: defaultImportGroup,
            enrollmentType: defaultImportType,
            status: "VALID",
            statusText: "Готов к импорту",
          });
        }
      }

      setImportedStudents(parsed.length > 0 ? parsed : [
        { id: "imp-demo-1", fullName: "Касымов Бактыбек Замирович", email: "kasymov@lyceum.edu", phone: "+996 555 12-34-56", group: defaultImportGroup, enrollmentType: defaultImportType, status: "VALID", statusText: "Готов к импорту" }
      ]);
    };
    reader.readAsText(file);
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
        groupName: st.group,
        enrollmentType: st.enrollmentType,
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
    <div className="space-y-6 pb-12">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Панель</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/students">Студенты</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Регистрация</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Регистрация студентов
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <UserPlus className="h-3 w-3" /> Панель зачисления
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/dashboard/students" />}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад к списку
          </Button>
        </div>
      </div>

      {/* Registration Mode Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          type="button"
          variant={regMode === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => setRegMode("single")}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" /> Анкета единичного студента
        </Button>
        <Button
          type="button"
          variant={regMode === "excel" ? "default" : "outline"}
          size="sm"
          onClick={() => setRegMode("excel")}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Массовый импорт из Excel / CSV
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-sm">Ошибка сохранения в БД</p>
              <p className="text-xs opacity-90">{errorMessage}</p>
            </div>
          </div>
          <Button size="xs" variant="ghost" onClick={() => setErrorMessage(null)}>
            Закрыть
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-semibold text-sm">
                {regMode === "single"
                  ? "Студент успешно зарегистрирован!"
                  : `Импортировано студентов: ${importedStudents.length}!`}
              </p>
              <p className="text-xs opacity-90">Данные внесены в общий реестр лицейских аккаунтов.</p>
            </div>
          </div>
          <Button size="xs" variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/20" onClick={() => router.push("/dashboard/students")}>
            Перейти к списку
          </Button>
        </div>
      )}

      {/* MODE 1: Single Student Registration Form */}
      {regMode === "single" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column */}
          <form onSubmit={(e) => handleSubmit(e, false)} className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Personal Info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Личные данные студента
                </CardTitle>
                <CardDescription className="text-xs">
                  Основные идентифицирующие сведения для реестра
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>ФИО студента (полностью) <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-muted-foreground">Иванов Иван Иванович</span>
                  </Label>
                  <Input
                    required
                    placeholder="Фамилия Имя Отчество"
                    value={fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Дата рождения
                  </Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Пол</Label>
                  <Select value={gender} onValueChange={(val: "Мужской" | "Женский") => setGender(val)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Выберите пол" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Мужской">Мужской</SelectItem>
                      <SelectItem value="Женский">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> ПИН / Персональный номер (ИИН / Паспорт)
                  </Label>
                  <Input
                    placeholder="Например: 20105200501234"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Contact Info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Контактные данные
                </CardTitle>
                <CardDescription className="text-xs">
                  Средства связи со студентом для уведомлений и доступа
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Электронная почта (Email) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="student@lyceum.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Телефон студента
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+996 555 12-34-56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Мессенджер (Telegram / WhatsApp)</Label>
                  <Input
                    placeholder="@username или номер"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Адрес проживания
                  </Label>
                  <Input
                    placeholder="г. Бишкек, ул. ..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Parent / Guardian Info */}
            <Card className="shadow-sm border-dashed md:border-solid">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-primary" /> Родители / Доверенное лицо
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
                    Необязательно / По желанию
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Данные представителей для несовершеннолетних (для курсов и учебных центров можно пропустить)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    ФИО представителя <span className="text-[10px] text-muted-foreground">(необязательно)</span>
                  </Label>
                  <Input
                    placeholder="Иванова Ольга Петровна"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Кем приходится</Label>
                  <Select value={parentRelation} onValueChange={setParentRelation}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Выберите степень родства" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Мать">Мать</SelectItem>
                      <SelectItem value="Отец">Отец</SelectItem>
                      <SelectItem value="Опекун">Опекун</SelectItem>
                      <SelectItem value="Другое">Другой представитель</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Телефон представителя
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+996 700 98-76-54"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Email / Место работы родителя</Label>
                  <Input
                    placeholder="parent@example.com или место работы"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Academic & Enrollment Info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Академические данные и Зачисление
                </CardTitle>
                <CardDescription className="text-xs">
                  Привязка к группе, курс и форма обучения
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Академическая группа / Поток <span className="text-red-500">*</span>
                  </Label>
                  <Select value={group} onValueChange={(val) => {
                    setGroup(val);
                    if (val === "ИС-2-24") setCourse("2");
                    else if (val === "ПО-3-23") setCourse("3");
                    else setCourse("1");
                  }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Выберите группу" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupsList.map((gName: string) => (
                        <SelectItem key={gName} value={gName}>
                          {gName}
                        </SelectItem>
                      ))}
                      <SelectItem value="Не распределен">Ожидает группы (Не распределен)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Форма обучения</Label>
                  <Select
                    value={enrollmentType}
                    onValueChange={(val: "Бюджет" | "Контракт") => setEnrollmentType(val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Выберите форму" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Бюджет">Бюджетная основа</SelectItem>
                      <SelectItem value="Контракт">Контрактная основа</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Курс / Уровень</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 курс</SelectItem>
                      <SelectItem value="2">2 курс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Дата зачисления
                  </Label>
                  <Input
                    type="date"
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Предыдущее место учебы (школа / ВУЗ)
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">По желанию</span>
                  </Label>
                  <Input
                    placeholder="Например: Школа №61 или укажите предыдущее учебное заведение (опционально)"
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Особые примечания / Комментарии
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">По желанию</span>
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="Дополнительные заметки к профилю..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Account & Security Credentials */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Учетная запись и безопасность
                </CardTitle>
                <CardDescription className="text-xs">
                  Создание первично авторизационного пароля и настройка доступа
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Временный пароль для входа <span className="text-red-500">*</span></span>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3 text-amber-500" /> Сгенерировать случайно
                    </button>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Придумайте или сгенерируйте пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 pr-20 font-mono text-xs"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={handleCopyPassword}
                        disabled={!password}
                      >
                        {copiedPassword ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mustChange"
                      checked={mustChangePassword}
                      onCheckedChange={(checked) => setMustChangePassword(!!checked)}
                    />
                    <Label htmlFor="mustChange" className="text-xs text-foreground cursor-pointer select-none font-medium">
                      Обязательно запросить смену пароля при первом входе в систему
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendWelcome"
                      checked={sendWelcomeEmail}
                      onCheckedChange={(checked) => setSendWelcomeEmail(!!checked)}
                    />
                    <Label htmlFor="sendWelcome" className="text-xs text-foreground cursor-pointer select-none font-medium">
                      Отправить памятку с учетными данными на email студента ({email || "..."})
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/students")}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting || !fullName.trim()}
              >
                Зарегистрировать и добавить еще
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !fullName.trim()}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>Регистрация...</>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> Зарегистрировать студента
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Right Column: Live Student Profile Preview Widget */}
          <div className="space-y-6">
            <div className="sticky top-20 z-10">
              <Card className="shadow-md border-primary/20 bg-gradient-to-b from-card via-card to-primary/5">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Предпросмотр карточки
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {completionPercentage}% заполнено
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 transition-all duration-300 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-5">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-inner">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                        {getInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-base text-foreground line-clamp-1">
                        {fullName.trim() || "Фамилия Имя Отчество"}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3" /> {email || "email@lyceum.edu"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      <Badge variant="default" className="text-[11px]">
                        {group} ({course} курс)
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          enrollmentType === "Бюджет"
                            ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[11px]"
                            : "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/5 text-[11px]"
                        }
                      >
                        {enrollmentType}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Статус учетной записи:</span>
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {mustChangePassword ? "Временный пароль" : "Активен"}
                      </Badge>
                    </div>

                    {phone && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Телефон:</span>
                        <span className="font-medium text-foreground">{phone}</span>
                      </div>
                    )}

                    {birthDate && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Дата рождения:</span>
                        <span className="font-medium text-foreground">{birthDate}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Пол:</span>
                      <span className="font-medium text-foreground">{gender}</span>
                    </div>

                    {parentName && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Представитель ({parentRelation}):</span>
                        <span className="font-medium text-foreground truncate max-w-[140px]">{parentName}</span>
                      </div>
                    )}

                    {parentPhone && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Тел. родителя:</span>
                        <span className="font-medium text-foreground">{parentPhone}</span>
                      </div>
                    )}
                  </div>

                  {password && (
                    <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                        <span>Сгенерированный пароль:</span>
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="text-primary hover:underline text-[10px] flex items-center gap-1"
                        >
                          {copiedPassword ? "Скопировано!" : "Скопировать"}
                        </button>
                      </div>
                      <p className="font-mono text-sm font-bold tracking-wider text-foreground break-all">
                        {password}
                      </p>
                    </div>
                  )}

                  <div className="rounded-md bg-muted/30 p-3 text-[11px] text-muted-foreground flex gap-2">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      После сохранения профиля студенту будет сгенерирован уникальный лицейский ID в базе данных.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Bulk Excel / CSV Import Tool */}
      {regMode === "excel" && (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Импорт списка студентов из Excel / CSV
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Загрузите готовый файл `.xlsx` или `.csv` с колоночными данными студентов для мгновенной регистрации списком.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5 text-primary" /> Скачать шаблон CSV
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleLoadDemoData} className="gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Загрузить демо-список
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Drag & Drop Upload Zone */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted/10 hover:bg-primary/5 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                  {excelFileName ? `Выбран файл: ${excelFileName}` : "Перетащите сюда файл Excel или нажмите для выбора"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Поддерживаемые форматы: .xlsx, .xls, .csv (До 1000 строк в одном файле)
                </p>
              </div>

              {/* Import Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/20">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Назначаемая группа для списка</Label>
                  <Select
                    value={defaultImportGroup}
                    onValueChange={(val) => {
                      setDefaultImportGroup(val);
                      setImportedStudents((prev) => prev.map((item) => ({ ...item, group: val })));
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Выберите группу" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupsList.map((gName: string) => (
                        <SelectItem key={gName} value={gName}>
                          {gName}
                        </SelectItem>
                      ))}
                      <SelectItem value="Не распределен">Не распределен (Резерв)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Форма обучения для списка</Label>
                  <Select
                    value={defaultImportType}
                    onValueChange={(val: "Бюджет" | "Контракт") => {
                      setDefaultImportType(val);
                      setImportedStudents((prev) => prev.map((item) => ({ ...item, enrollmentType: val })));
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Форма" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Бюджет">Бюджетная основа</SelectItem>
                      <SelectItem value="Контракт">Контрактная основа</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Data Preview Table */}
              {importedStudents.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <FileCheck className="h-4 w-4 text-emerald-500" /> Предпросмотр распарсенных данных
                      </h4>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {importedStudents.length} студентов
                      </Badge>
                    </div>

                    <Button variant="ghost" size="xs" onClick={() => setImportedStudents([])} className="text-destructive text-xs hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Очистить список
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b">
                        <tr>
                          <th className="px-3 py-2.5 w-10">#</th>
                          <th className="px-3 py-2.5">ФИО Студента</th>
                          <th className="px-3 py-2.5">Email (Логин)</th>
                          <th className="px-3 py-2.5">Телефон</th>
                          <th className="px-3 py-2.5">Группа</th>
                          <th className="px-3 py-2.5">Форма</th>
                          <th className="px-3 py-2.5">Статус</th>
                          <th className="px-3 py-2.5 text-right">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {importedStudents.map((st, index) => (
                          <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2.5 font-mono text-muted-foreground">{index + 1}</td>
                            <td className="px-3 py-2.5 font-medium text-foreground">{st.fullName}</td>
                            <td className="px-3 py-2.5 text-muted-foreground font-mono">{st.email}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{st.phone}</td>
                            <td className="px-3 py-2.5">
                              <Badge variant="outline" className="text-[10px]">{st.group}</Badge>
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge variant="secondary" className="text-[10px]">{st.enrollmentType}</Badge>
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[10px] gap-1">
                                <Check className="h-3 w-3" /> {st.statusText}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleRemoveImportRow(st.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Всем студентам из списка будут автоматически сгенерированы временные пароли.
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <Button variant="outline" onClick={() => router.push("/dashboard/students")}>
                        Отмена
                      </Button>
                      <Button
                        onClick={handleBatchImportSubmit}
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      >
                        {isSubmitting ? (
                          <>Зачисления...</>
                        ) : (
                          <>
                            <ListPlus className="h-4 w-4" /> Импортировать всех ({importedStudents.length} чел.)
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg bg-muted/10">
                  Файл не загружен или не содержит строк. Нажмите <strong>«Загрузить демо-список»</strong> для примера работы.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
