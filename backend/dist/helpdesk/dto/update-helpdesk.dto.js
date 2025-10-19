"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHelpdeskDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_helpdesk_dto_1 = require("./create-helpdesk.dto");
class UpdateHelpdeskDto extends (0, swagger_1.PartialType)(create_helpdesk_dto_1.CreateHelpdeskDto) {
}
exports.UpdateHelpdeskDto = UpdateHelpdeskDto;
//# sourceMappingURL=update-helpdesk.dto.js.map