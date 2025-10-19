export declare class GenerateReportDto {
    dateFrom: string;
    dateTo: string;
    format: "csv" | "xlsx" | "pdf" | "json";
    filters?: {
        status?: string;
        priority?: string;
        categoryId?: string;
        departmentId?: string;
        assigneeId?: string;
        [key: string]: any;
    };
    title?: string;
    description?: string;
}
