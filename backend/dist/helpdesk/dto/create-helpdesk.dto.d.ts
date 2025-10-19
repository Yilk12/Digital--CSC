import { TicketPriority, TicketCategory } from "@prisma/client";
export declare class CreateHelpdeskDto {
    title: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
    departmentId?: string;
    assigneeId?: string;
}
