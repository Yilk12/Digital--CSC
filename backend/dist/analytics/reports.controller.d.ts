import { Response } from "express";
import { ReportsService } from "./reports.service";
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    generateTicketReport(startDate: string, endDate: string, format: "json" | "csv" | undefined, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    generateKnowledgeBaseReport(startDate: string, endDate: string, format: "json" | "csv" | undefined, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    generateUserReport(startDate: string, endDate: string, format: "json" | "csv" | undefined, res: Response): Promise<Response<any, Record<string, any>>>;
    generatePerformanceReport(startDate: string, endDate: string, format: "json" | "csv" | undefined, res: Response): Promise<Response<any, Record<string, any>>>;
}
