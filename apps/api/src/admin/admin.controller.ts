import {
  Body, Controller, Delete, Get, Param,
  Post, Put, Query, UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class AdminController {
  constructor(private admin: AdminService) {}

  // Dashboard
  @Get("stats") getDashboardStats() { return this.admin.getDashboardStats(); }

  // Users
  @Get("users")
  getUsers(
    @Query("page") page?: string,
    @Query("search") search?: string,
    @Query("plan") plan?: string,
  ) { return this.admin.getUsers(parseInt(page ?? "1") || 1, undefined, search, plan); }

  @Get("users/active") getActiveUsers() { return this.admin.getActiveUsers(); }
  @Get("users/:id") getUserDetail(@Param("id") id: string) { return this.admin.getUserDetail(id); }

  @Put("users/:id")
  updateUser(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() data: any,
  ) { return this.admin.updateUser(user.id, id, data); }

  @Delete("users/:id")
  deleteUser(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
  ) { return this.admin.deleteUser(user.id, id); }

  // Finance
  @Get("finance") getFinance(@Query("page") page?: string) { return this.admin.getFinance(parseInt(page ?? "1") || 1); }

  // Tickets
  @Get("tickets") getAllTickets(@Query("status") status?: string) { return this.admin.getAllTickets(status); }
  @Post("tickets/:id/reply")
  replyTicket(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body("message") message: string,
  ) { return this.admin.adminReplyTicket(user.id, id, message); }

  @Put("tickets/:id/status")
  updateTicketStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.admin.updateTicketStatus(id, status);
  }

  // Blog
  @Get("blog") getBlogPosts(@Query("page") page?: string) { return this.admin.getBlogPosts(parseInt(page ?? "1") || 1); }
  @Get("blog/:id") getBlogPost(@Param("id") id: string) { return this.admin.getBlogPost(id); }
  @Post("blog")
  createBlogPost(@CurrentUser() user: { id: string }, @Body() data: any) {
    return this.admin.createBlogPost(user.id, data);
  }
  @Put("blog/:id") updateBlogPost(@Param("id") id: string, @Body() data: any) {
    return this.admin.updateBlogPost(id, data);
  }
  @Delete("blog/:id") deleteBlogPost(@Param("id") id: string) { return this.admin.deleteBlogPost(id); }

  // Page Content
  @Get("content/:id") getPageContent(@Param("id") id: string) { return this.admin.getPageContent(id); }
  @Put("content/:id") updatePageContent(@Param("id") id: string, @Body() data: any) {
    return this.admin.updatePageContent(id, data);
  }

  // Landing Pages
  @Get("landing-pages") getLandingPages() { return this.admin.getLandingPages(); }
  @Get("landing-pages/:id") getLandingPage(@Param("id") id: string) { return this.admin.getLandingPage(id); }
  @Post("landing-pages") createLandingPage(@Body() data: any) { return this.admin.createLandingPage(data); }
  @Put("landing-pages/:id") updateLandingPage(@Param("id") id: string, @Body() data: any) {
    return this.admin.updateLandingPage(id, data);
  }
  @Delete("landing-pages/:id") deleteLandingPage(@Param("id") id: string) {
    return this.admin.deleteLandingPage(id);
  }

  // Notifications
  @Get("notifications") getNotifications() { return this.admin.getNotifications(); }
  @Post("notifications") sendNotification(@Body() data: any) { return this.admin.sendNotification(data); }
  @Delete("notifications/:id") deleteNotification(@Param("id") id: string) {
    return this.admin.deleteNotification(id);
  }

  // Coupons
  @Get("coupons") getAllCoupons() { return this.admin.getAllCoupons(); }
  @Post("coupons") createGlobalCoupon(@Body() data: any) { return this.admin.createGlobalCoupon(data); }
  @Delete("coupons/:id") deleteCoupon(@Param("id") id: string) { return this.admin.deleteCoupon(id); }

  // Settings
  @Get("settings") getSettings() { return this.admin.getSettings(); }
  @Put("settings")
  updateSettings(@CurrentUser() user: { id: string }, @Body() data: any) {
    return this.admin.updateSettings(user.id, data);
  }
  @Post("settings/credentials")
  changeCredentials(@CurrentUser() user: { id: string }, @Body() data: any) {
    return this.admin.changeAdminCredentials(user.id, data);
  }

  // Admins
  @Get("admins") getAdmins() { return this.admin.getAdmins(); }
  @Put("admins/:id/role")
  promoteUser(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body("role") role: "ADMIN" | "USER",
  ) { return this.admin.promoteUser(user.id, id, role); }

  // Logs
  @Get("logs") getLogs(@Query("page") page?: string) { return this.admin.getLogs(parseInt(page ?? "1") || 1); }

  // Tool Stats
  @Get("tool-stats") getToolStats() { return this.admin.getToolStats(); }

  // Server Stats
  @Get("server-stats") getServerStats() { return this.admin.getServerStats(); }
}
