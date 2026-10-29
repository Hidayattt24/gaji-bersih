import type { AnalysisMarkdownResult } from "@/lib/openai/types";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_KEYS = {
  session: "gajibersih.demo.session",
  profile: "gajibersih.demo.profile",
  history: "gajibersih.demo.history",
  privacy: "gajibersih.demo.privacy",
} as const;

export type DemoProfile = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  location: string;
  avatar_path: string;
};

export const DEMO_PROFILE: DemoProfile = {
  id: "demo-user-001",
  full_name: "Nadia Pratama",
  username: "nadiapratama",
  email: "nadia.pratama@example.com",
  location: "Jakarta, Indonesia",
  avatar_path: "/dummy/dummyProfil.png",
};

const DEMO_CHAT_ID = "11111111-1111-4111-8111-111111111111";
const DEMO_DOCUMENT_ID = "22222222-2222-4222-8222-222222222222";

export function makeDemoAnalysis(
  fileName = "Kontrak_Kerja_Nadia_Pratama.pdf",
  type = "contract"
): AnalysisMarkdownResult {
  return {
    analysis_id: `demo-analysis-${Date.now()}`,
    chat_id: DEMO_CHAT_ID,
    document: {
      id: DEMO_DOCUMENT_ID,
      name: fileName,
      type,
      uploaded_at: new Date().toISOString(),
    },
    markdown_content: `# Ringkasan Analisis Dokumen

Dokumen menawarkan **gaji pokok Rp8.000.000** per bulan dengan estimasi **take home pay Rp8.700.000** setelah tunjangan dan potongan.

## Hal yang Perlu Diperhatikan

1. **Masa percobaan** tercantum selama 3 bulan dan tetap memberikan hak upah penuh.
2. **Jam kerja** adalah 40 jam per minggu. Pastikan mekanisme lembur dijelaskan secara tertulis.
3. **Pemutusan hubungan kerja** mensyaratkan pemberitahuan 30 hari sebelumnya.
4. **Klausul kerahasiaan** berlaku selama bekerja dan 12 bulan setelah hubungan kerja berakhir.

## Rincian Penghasilan

- Gaji pokok: Rp8.000.000
- Tunjangan transportasi: Rp500.000
- Tunjangan makan: Rp400.000
- Potongan BPJS dan pajak: Rp200.000
- **Perkiraan gaji bersih: Rp8.700.000**

## Rekomendasi

Mintalah HR mengonfirmasi perhitungan lembur, tanggal evaluasi setelah masa percobaan, dan rincian komponen potongan sebelum menandatangani dokumen.`,
    metadata: {
      analyzed_at: new Date().toISOString(),
      model_used: "GajiBersih Demo AI",
      search_methods_used: ["file_search", "web_search"],
      tokens_used: { prompt_tokens: 1240, completion_tokens: 680, total_tokens: 1920 },
      processing_time_ms: 1800,
    },
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const demoService = {
  signIn(email?: string) {
    const profile = { ...DEMO_PROFILE, email: email || DEMO_PROFILE.email };
    localStorage.setItem(DEMO_KEYS.profile, JSON.stringify(profile));
    localStorage.setItem(DEMO_KEYS.session, JSON.stringify({ userId: profile.id, active: true }));
    return profile;
  },
  signUp(profile: Partial<DemoProfile>) {
    const next = { ...DEMO_PROFILE, ...profile };
    localStorage.setItem(DEMO_KEYS.profile, JSON.stringify(next));
    localStorage.setItem(DEMO_KEYS.session, JSON.stringify({ userId: next.id, active: true }));
    return next;
  },
  signOut() {
    localStorage.removeItem(DEMO_KEYS.session);
  },
  getProfile() {
    return readJson(DEMO_KEYS.profile, DEMO_PROFILE);
  },
  updateProfile(patch: Partial<DemoProfile>) {
    const next = { ...this.getProfile(), ...patch };
    localStorage.setItem(DEMO_KEYS.profile, JSON.stringify(next));
    return next;
  },
  startAnalysis(fileName: string, type: string) {
    localStorage.setItem("analysisChatId", DEMO_CHAT_ID);
    localStorage.setItem("analysisDocumentId", DEMO_DOCUMENT_ID);
    localStorage.setItem("analysisType", type);
    localStorage.setItem("uploadedFileName", fileName);
    return { chatId: DEMO_CHAT_ID, documentId: DEMO_DOCUMENT_ID };
  },
  completeAnalysis(fileName?: string, type?: string) {
    const result = makeDemoAnalysis(fileName, type);
    localStorage.setItem("latestAnalysisResult", JSON.stringify(result));
    const history = readJson<Array<Record<string, unknown>>>(DEMO_KEYS.history, []);
    history.unshift({ id: result.analysis_id, title: result.document.name, date: result.metadata.analyzed_at, type: result.document.type });
    localStorage.setItem(DEMO_KEYS.history, JSON.stringify(history.slice(0, 20)));
    return result;
  },
  answerChat(question: string) {
    const normalized = question.toLowerCase();
    if (normalized.includes("hr") || normalized.includes("keberatan")) {
      return "Sampaikan kepada HR secara tenang dan spesifik. Sebutkan klausul yang ingin diklarifikasi, alasan Anda, lalu minta konfirmasi tertulis sebelum menandatangani kontrak.";
    }
    if (normalized.includes("risiko") || normalized.includes("bahaya")) {
      return "Risiko utama berada pada ketentuan lembur yang belum rinci, masa berlaku kerahasiaan, dan mekanisme penghentian kontrak. Ketiganya sebaiknya dikonfirmasi tertulis.";
    }
    return "Berdasarkan dokumen demo, penawaran ini cukup wajar. Namun, pastikan perhitungan lembur, evaluasi masa percobaan, dan seluruh potongan dijelaskan secara tertulis oleh HR.";
  },
  reset() {
    Object.values(DEMO_KEYS).forEach((key) => localStorage.removeItem(key));
    ["analysisChatId", "analysisDocumentId", "analysisType", "uploadedFile", "uploadedFileType", "uploadedFileName", "latestAnalysisResult", "savedQuestions"].forEach((key) => localStorage.removeItem(key));
  },
};
