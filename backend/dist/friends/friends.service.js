"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFriendRequests = getFriendRequests;
exports.sendFriendRequest = sendFriendRequest;
exports.deleteFriendRequest = deleteFriendRequest;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getFriendRequests(userId) {
    return prisma.friendRequest.findMany({
        where: { toUserId: userId, status: 'PENDING' },
    });
}
async function sendFriendRequest(fromUserId, toUserId) {
    return prisma.friendRequest.create({
        data: {
            fromUserId,
            toUserId,
            status: 'PENDING',
        },
    });
}
async function deleteFriendRequest(requestId) {
    return prisma.friendRequest.delete({
        where: { id: requestId },
    });
}
//# sourceMappingURL=friends.service.js.map