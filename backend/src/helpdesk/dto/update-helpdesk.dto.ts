import { PartialType } from "@nestjs/swagger"
import { CreateHelpdeskDto } from "./create-helpdesk.dto"

export class UpdateHelpdeskDto extends PartialType(CreateHelpdeskDto) {}
