"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalizationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let LocalizationService = class LocalizationService {
    constructor() {
        this.translations = {
            "common.yes": {
                [client_1.Language.EN]: "Yes",
                [client_1.Language.AM]: "አዎ",
                [client_1.Language.OR]: "Eeyyee",
                [client_1.Language.TI]: "እወ",
                [client_1.Language.SO]: "Haa",
                [client_1.Language.SI]: "Haa",
                [client_1.Language.WO]: "Waaw",
            },
            "common.no": {
                [client_1.Language.EN]: "No",
                [client_1.Language.AM]: "አይ",
                [client_1.Language.OR]: "Lakki",
                [client_1.Language.TI]: "አይ",
                [client_1.Language.SO]: "Maya",
                [client_1.Language.SI]: "Maya",
                [client_1.Language.WO]: "Déedet",
            },
            "common.save": {
                [client_1.Language.EN]: "Save",
                [client_1.Language.AM]: "አስቀምጥ",
                [client_1.Language.OR]: "Olkaa'i",
                [client_1.Language.TI]: "ኣቐምጥ",
                [client_1.Language.SO]: "Kaydi",
                [client_1.Language.SI]: "Kaydi",
                [client_1.Language.WO]: "Dakk",
            },
            "common.cancel": {
                [client_1.Language.EN]: "Cancel",
                [client_1.Language.AM]: "ሰርዝ",
                [client_1.Language.OR]: "Dhiisi",
                [client_1.Language.TI]: "ሰርዝ",
                [client_1.Language.SO]: "Jooji",
                [client_1.Language.SI]: "Jooji",
                [client_1.Language.WO]: "Neenal",
            },
            "common.delete": {
                [client_1.Language.EN]: "Delete",
                [client_1.Language.AM]: "ሰርዝ",
                [client_1.Language.OR]: "Balleessi",
                [client_1.Language.TI]: "ደምስስ",
                [client_1.Language.SO]: "Tirtir",
                [client_1.Language.SI]: "Tirtir",
                [client_1.Language.WO]: "Far",
            },
            "common.edit": {
                [client_1.Language.EN]: "Edit",
                [client_1.Language.AM]: "አርም",
                [client_1.Language.OR]: "Gulali",
                [client_1.Language.TI]: "ኣርም",
                [client_1.Language.SO]: "Wax ka beddel",
                [client_1.Language.SI]: "Wax ka beddel",
                [client_1.Language.WO]: "Soppi",
            },
            "common.create": {
                [client_1.Language.EN]: "Create",
                [client_1.Language.AM]: "ፍጠር",
                [client_1.Language.OR]: "Uumi",
                [client_1.Language.TI]: "ፍጠር",
                [client_1.Language.SO]: "Samee",
                [client_1.Language.SI]: "Samee",
                [client_1.Language.WO]: "Sos",
            },
            "common.search": {
                [client_1.Language.EN]: "Search",
                [client_1.Language.AM]: "ፈልግ",
                [client_1.Language.OR]: "Barbaadi",
                [client_1.Language.TI]: "ደልይ",
                [client_1.Language.SO]: "Raadi",
                [client_1.Language.SI]: "Raadi",
                [client_1.Language.WO]: "Ceet",
            },
            "ticket.title": {
                [client_1.Language.EN]: "Ticket",
                [client_1.Language.AM]: "ትኬት",
                [client_1.Language.OR]: "Tikeetii",
                [client_1.Language.TI]: "ትኬት",
                [client_1.Language.SO]: "Tikidh",
                [client_1.Language.SI]: "Tikidh",
                [client_1.Language.WO]: "Billet",
            },
            "ticket.status.open": {
                [client_1.Language.EN]: "Open",
                [client_1.Language.AM]: "ክፍት",
                [client_1.Language.OR]: "Banaa",
                [client_1.Language.TI]: "ክፉት",
                [client_1.Language.SO]: "Furan",
                [client_1.Language.SI]: "Furan",
                [client_1.Language.WO]: "Ubbi",
            },
            "ticket.status.in_progress": {
                [client_1.Language.EN]: "In Progress",
                [client_1.Language.AM]: "በሂደት ላይ",
                [client_1.Language.OR]: "Adeemsa keessa",
                [client_1.Language.TI]: "ኣብ መስርሕ",
                [client_1.Language.SO]: "Socda",
                [client_1.Language.SI]: "Socda",
                [client_1.Language.WO]: "Dëgg na",
            },
            "ticket.status.resolved": {
                [client_1.Language.EN]: "Resolved",
                [client_1.Language.AM]: "ተፈትቷል",
                [client_1.Language.OR]: "Furmaata argateera",
                [client_1.Language.TI]: "ተፈቲሑ",
                [client_1.Language.SO]: "La xalliyay",
                [client_1.Language.SI]: "La xalliyay",
                [client_1.Language.WO]: "Dafa ñu ko wax",
            },
            "ticket.priority.low": {
                [client_1.Language.EN]: "Low",
                [client_1.Language.AM]: "ዝቅተኛ",
                [client_1.Language.OR]: "Gadi",
                [client_1.Language.TI]: "ትሑት",
                [client_1.Language.SO]: "Hoose",
                [client_1.Language.SI]: "Hoose",
                [client_1.Language.WO]: "Suuf",
            },
            "ticket.priority.medium": {
                [client_1.Language.EN]: "Medium",
                [client_1.Language.AM]: "መካከለኛ",
                [client_1.Language.OR]: "Giddu galeessa",
                [client_1.Language.TI]: "ማእከላይ",
                [client_1.Language.SO]: "Dhexe",
                [client_1.Language.SI]: "Dhexe",
                [client_1.Language.WO]: "Diggu",
            },
            "ticket.priority.high": {
                [client_1.Language.EN]: "High",
                [client_1.Language.AM]: "ከፍተኛ",
                [client_1.Language.OR]: "Ol'aanaa",
                [client_1.Language.TI]: "ልዑል",
                [client_1.Language.SO]: "Sare",
                [client_1.Language.SI]: "Sare",
                [client_1.Language.WO]: "Gëstu",
            },
            "ticket.priority.urgent": {
                [client_1.Language.EN]: "Urgent",
                [client_1.Language.AM]: "አስቸኳይ",
                [client_1.Language.OR]: "Ariifataa",
                [client_1.Language.TI]: "ህጹጽ",
                [client_1.Language.SO]: "Degdeg ah",
                [client_1.Language.SI]: "Degdeg ah",
                [client_1.Language.WO]: "Suuf na",
            },
            "kb.article": {
                [client_1.Language.EN]: "Article",
                [client_1.Language.AM]: "ጽሑፍ",
                [client_1.Language.OR]: "Barreeffama",
                [client_1.Language.TI]: "ጽሑፍ",
                [client_1.Language.SO]: "Maqaal",
                [client_1.Language.SI]: "Maqaal",
                [client_1.Language.WO]: "Bind",
            },
            "kb.category": {
                [client_1.Language.EN]: "Category",
                [client_1.Language.AM]: "ምድብ",
                [client_1.Language.OR]: "Ramaddii",
                [client_1.Language.TI]: "ምድብ",
                [client_1.Language.SO]: "Qaybta",
                [client_1.Language.SI]: "Qaybta",
                [client_1.Language.WO]: "Wàll",
            },
            "role.general_director": {
                [client_1.Language.EN]: "General Director",
                [client_1.Language.AM]: "ዋና ዳይሬክተር",
                [client_1.Language.OR]: "Daayireektara Waliigalaa",
                [client_1.Language.TI]: "ሓፈሻዊ ዳይረክተር",
                [client_1.Language.SO]: "Agaasime Guud",
                [client_1.Language.SI]: "Agaasime Guud",
                [client_1.Language.WO]: "Direktëru bu Mag",
            },
            "role.staff_manager": {
                [client_1.Language.EN]: "Staff Manager",
                [client_1.Language.AM]: "የሰራተኞች አስተዳዳሪ",
                [client_1.Language.OR]: "Bulchaa Hojjettootaa",
                [client_1.Language.TI]: "ኣመሓዳሪ ሰራሕተኛታት",
                [client_1.Language.SO]: "Maamulaha Shaqaalaha",
                [client_1.Language.SI]: "Maamulaha Shaqaalaha",
                [client_1.Language.WO]: "Boroom Liggéey",
            },
            "role.admin": {
                [client_1.Language.EN]: "Administrator",
                [client_1.Language.AM]: "አስተዳዳሪ",
                [client_1.Language.OR]: "Bulchaa",
                [client_1.Language.TI]: "ኣመሓዳሪ",
                [client_1.Language.SO]: "Maamule",
                [client_1.Language.SI]: "Maamule",
                [client_1.Language.WO]: "Boroom",
            },
            "role.support_agent": {
                [client_1.Language.EN]: "Support Agent",
                [client_1.Language.AM]: "የድጋፍ ወኪል",
                [client_1.Language.OR]: "Bakka bu'aa Deeggaraa",
                [client_1.Language.TI]: "ወኪል ደገፍ",
                [client_1.Language.SO]: "Wakiilka Taageerada",
                [client_1.Language.SI]: "Wakiilka Taageerada",
                [client_1.Language.WO]: "Wakiilu Wallante",
            },
            "role.end_user": {
                [client_1.Language.EN]: "End User",
                [client_1.Language.AM]: "የመጨረሻ ተጠቃሚ",
                [client_1.Language.OR]: "Fayyadamaa Dhumaa",
                [client_1.Language.TI]: "ናይ መወዳእታ ተጠቃሚ",
                [client_1.Language.SO]: "Isticmaale Dhammaad",
                [client_1.Language.SI]: "Isticmaale Dhammaad",
                [client_1.Language.WO]: "Jëfandikukat bu mujj",
            },
            "email.ticket.created.subject": {
                [client_1.Language.EN]: "New Ticket Created: {{title}}",
                [client_1.Language.AM]: "አዲስ ትኬት ተፈጥሯል: {{title}}",
                [client_1.Language.OR]: "Tikeetiin Haaraan Uumameera: {{title}}",
                [client_1.Language.TI]: "ሓድሽ ትኬት ተፈጢሩ: {{title}}",
                [client_1.Language.SO]: "Tikidh Cusub oo la sameeyay: {{title}}",
                [client_1.Language.SI]: "Tikidh Cusub oo la sameeyay: {{title}}",
                [client_1.Language.WO]: "Billet bu bees la sos: {{title}}",
            },
            "email.ticket.assigned.subject": {
                [client_1.Language.EN]: "Ticket Assigned to You: {{title}}",
                [client_1.Language.AM]: "ትኬት ተመድቦልዎታል: {{title}}",
                [client_1.Language.OR]: "Tikeetiin siif ramadameera: {{title}}",
                [client_1.Language.TI]: "ትኬት ተመዲቡልካ: {{title}}",
                [client_1.Language.SO]: "Tikidh laguu qoondeeyay: {{title}}",
                [client_1.Language.SI]: "Tikidh laguu qoondeeyay: {{title}}",
                [client_1.Language.WO]: "Billet nga joxe la: {{title}}",
            },
            "notification.welcome": {
                [client_1.Language.EN]: "Welcome to Ethiopian Civil Service Commission Helpdesk",
                [client_1.Language.AM]: "ወደ የኢትዮጵያ ሲቪል ሰርቪስ ኮሚሽን የእርዳታ ዴስክ እንኳን በደህና መጡ",
                [client_1.Language.OR]: "Gara Desk Gargaarsa Komishina Tajaajila Siviilii Itoophiyaatti baga nagaan dhuftan",
                [client_1.Language.TI]: "ናብ ሓገዝ ዴስክ ኮሚሽን ሲቪል ሰርቪስ ኢትዮጵያ እንቋዕ ብደሓን መጻእኩም",
                [client_1.Language.SO]: "Ku soo dhawoow Miiska Caawinta Guddiga Adeegga Madaniga Itoobiya",
                [client_1.Language.SI]: "Ku soo dhawoow Miiska Caawinta Guddiga Adeegga Madaniga Itoobiya",
                [client_1.Language.WO]: "Dalal ak jamm ci biro caaw bu Komise yu Sërvisu Siviil yu Ecoopi",
            },
        };
    }
    translate(key, language = client_1.Language.EN, params) {
        const translation = this.translations[key];
        if (!translation) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }
        let text = translation[language] || translation[client_1.Language.EN] || key;
        if (params) {
            Object.entries(params).forEach(([param, value]) => {
                text = text.replace(new RegExp(`{{${param}}}`, "g"), value);
            });
        }
        return text;
    }
    getAvailableLanguages() {
        return Object.values(client_1.Language);
    }
    getLanguageName(language) {
        const names = {
            [client_1.Language.EN]: "English",
            [client_1.Language.AM]: "አማርኛ (Amharic)",
            [client_1.Language.OR]: "Afaan Oromoo (Oromo)",
            [client_1.Language.TI]: "ትግርኛ (Tigrinya)",
            [client_1.Language.SO]: "Soomaali (Somali)",
            [client_1.Language.SI]: "Sidaamu Afoo (Sidama)",
            [client_1.Language.WO]: "Wolof",
        };
        return names[language] || language;
    }
    detectLanguageFromText(text) {
        if (/[\u1200-\u137F]/.test(text)) {
            return client_1.Language.AM;
        }
        if (/[\u0600-\u06FF]/.test(text)) {
            return client_1.Language.SO;
        }
        return client_1.Language.EN;
    }
    formatDate(date, language = client_1.Language.EN) {
        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        const locales = {
            [client_1.Language.EN]: "en-US",
            [client_1.Language.AM]: "am-ET",
            [client_1.Language.OR]: "om-ET",
            [client_1.Language.TI]: "ti-ET",
            [client_1.Language.SO]: "so-ET",
            [client_1.Language.SI]: "sid-ET",
            [client_1.Language.WO]: "wo-SN",
        };
        try {
            return new Intl.DateTimeFormat(locales[language] || "en-US", options).format(date);
        }
        catch (error) {
            return new Intl.DateTimeFormat("en-US", options).format(date);
        }
    }
    formatNumber(number, language = client_1.Language.EN) {
        const locales = {
            [client_1.Language.EN]: "en-US",
            [client_1.Language.AM]: "am-ET",
            [client_1.Language.OR]: "om-ET",
            [client_1.Language.TI]: "ti-ET",
            [client_1.Language.SO]: "so-ET",
            [client_1.Language.SI]: "sid-ET",
            [client_1.Language.WO]: "wo-SN",
        };
        try {
            return new Intl.NumberFormat(locales[language] || "en-US").format(number);
        }
        catch (error) {
            return new Intl.NumberFormat("en-US").format(number);
        }
    }
    getTextDirection(language) {
        return "ltr";
    }
};
exports.LocalizationService = LocalizationService;
exports.LocalizationService = LocalizationService = __decorate([
    (0, common_1.Injectable)()
], LocalizationService);
//# sourceMappingURL=localization.service.js.map