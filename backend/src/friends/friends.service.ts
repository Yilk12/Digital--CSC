import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getFriendRequests(userId: string) {
  return prisma.friendRequest.findMany({
    where: { toUserId: userId, status: 'PENDING' },
  });
}

export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  return prisma.friendRequest.create({
    data: {
      fromUserId,
      toUserId,
      status: 'PENDING',
    },
  });
}

export async function deleteFriendRequest(requestId: string) {
  return prisma.friendRequest.delete({
    where: { id: requestId },
  });
}
