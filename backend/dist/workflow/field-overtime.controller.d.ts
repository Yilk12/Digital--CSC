export declare class FieldOvertimeController {
    getFieldRequests(): {
        ok: boolean;
        data: never[];
        message: string;
    };
    createFieldRequest(body: any): {
        ok: boolean;
        data: any;
        message: string;
    };
    getFieldRequest(id: string): {
        ok: boolean;
        data: {
            id: string;
        };
        message: string;
    };
    updateFieldRequest(id: string, body: any): {
        ok: boolean;
        data: any;
        message: string;
    };
    removeFieldRequest(id: string): {
        ok: boolean;
        id: string;
        message: string;
    };
    approveFieldRequest(id: string): {
        ok: boolean;
        id: string;
        status: string;
        message: string;
    };
    getOvertimeRequests(): {
        ok: boolean;
        data: never[];
        message: string;
    };
    createOvertimeRequest(body: any): {
        ok: boolean;
        data: any;
        message: string;
    };
    getOvertimeRequest(id: string): {
        ok: boolean;
        data: {
            id: string;
        };
        message: string;
    };
    updateOvertimeRequest(id: string, body: any): {
        ok: boolean;
        data: any;
        message: string;
    };
    removeOvertimeRequest(id: string): {
        ok: boolean;
        id: string;
        message: string;
    };
    approveOvertimeRequest(id: string): {
        ok: boolean;
        id: string;
        status: string;
        message: string;
    };
}
