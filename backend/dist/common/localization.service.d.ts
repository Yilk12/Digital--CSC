import { Language } from "@prisma/client";
export declare class LocalizationService {
    private translations;
    translate(key: string, language?: Language, params?: Record<string, string>): string;
    getAvailableLanguages(): Language[];
    getLanguageName(language: Language): string;
    detectLanguageFromText(text: string): Language;
    formatDate(date: Date, language?: Language): string;
    formatNumber(number: number, language?: Language): string;
    getTextDirection(language: Language): "ltr" | "rtl";
}
