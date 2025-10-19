export declare enum AdvertisementCategory {
    HR = "HR",
    IT = "IT",
    Facilities = "Facilities",
    Policy = "Policy",
    Other = "Other"
}
export declare enum AdvertisementPriority {
    Low = "Low",
    Medium = "Medium",
    High = "High"
}
export declare class CreateAdvertisementDto {
    title: string;
    description: string;
    category: AdvertisementCategory;
    priority?: AdvertisementPriority;
    publishDate?: string;
    expiryDate?: string;
    isPublished?: boolean;
    isUrgent?: boolean;
}
