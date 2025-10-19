export declare class FriendsController {
    getFriendRequests(req: any): never[];
    sendFriendRequest(req: any, body: {
        toUserId: string;
    }): {
        message: string;
    };
    deleteFriendRequest(req: any, requestId: string): {
        message: string;
    };
}
