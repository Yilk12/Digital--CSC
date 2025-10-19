import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Friends")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("friends")
export class FriendsController {
  @Get("requests")
  getFriendRequests(@Request() req) {
    // Return pending friend requests for the logged-in user
    return [];
  }

  @Post("request")
  sendFriendRequest(@Request() req, @Body() body: { toUserId: string }) {
    // Send a friend request from logged-in user to another user
    return { message: "Friend request sent" };
  }

  @Delete("request/:id")
  deleteFriendRequest(@Request() req, @Param("id") requestId: string) {
    // Delete a friend request by ID
    return { message: "Friend request deleted" };
  }
}
