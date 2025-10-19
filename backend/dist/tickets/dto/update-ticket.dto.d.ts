import { CreateTicketDto } from "./create-ticket.dto";
import { TicketStatus } from "@prisma/client";
declare const UpdateTicketDto_base: import("@nestjs/common").Type<Partial<CreateTicketDto>>;
export declare class UpdateTicketDto extends UpdateTicketDto_base {
    status?: TicketStatus;
}
export {};
