import { PrismaService } from '../prisma/prisma.service';
export declare class FleetService {
    private prisma;
    constructor(prisma: PrismaService);
    listVehicles(q?: string): Promise<{
        id: string;
        createdAt: Date;
        departmentId: string | null;
        year: number | null;
        plate: string;
        make: string | null;
        model: string | null;
    }[]>;
    createVehicle(body: {
        plate: string;
        make?: string;
        model?: string;
        year?: number;
        departmentId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        departmentId: string | null;
        year: number | null;
        plate: string;
        make: string | null;
        model: string | null;
    }>;
    updateVehicle(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        departmentId: string | null;
        year: number | null;
        plate: string;
        make: string | null;
        model: string | null;
    }>;
    deleteVehicle(id: string): Promise<{
        id: string;
        createdAt: Date;
        departmentId: string | null;
        year: number | null;
        plate: string;
        make: string | null;
        model: string | null;
    }>;
    listRequests(status?: string): Promise<{
        id: number;
        createdAt: Date;
        status: string;
        date: Date;
        requestorId: string;
        purpose: string;
        tripType: string | null;
        destination: string | null;
    }[]>;
    createRequest(body: {
        requestorId: string;
        purpose: string;
        tripType?: string;
        destination?: string;
        date: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        status: string;
        date: Date;
        requestorId: string;
        purpose: string;
        tripType: string | null;
        destination: string | null;
    }>;
    setRequestStatus(id: number, status: 'APPROVED' | 'REJECTED'): Promise<{
        id: number;
        createdAt: Date;
        status: string;
        date: Date;
        requestorId: string;
        purpose: string;
        tripType: string | null;
        destination: string | null;
    }>;
    listTrips(vehicleId?: string): Promise<{
        id: string;
        createdAt: Date;
        origin: string | null;
        destination: string | null;
        vehicleId: string;
        driverId: string;
        startAt: Date;
        distanceKm: number | null;
    }[]>;
    createTrip(body: {
        vehicleId: string;
        driverId: string;
        startAt: string;
        origin?: string;
        destination?: string;
        distanceKm?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        origin: string | null;
        destination: string | null;
        vehicleId: string;
        driverId: string;
        startAt: Date;
        distanceKm: number | null;
    }>;
}
