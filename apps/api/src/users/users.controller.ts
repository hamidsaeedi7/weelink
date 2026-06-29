import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { IsString, MinLength, IsOptional, IsEmail, IsIn, IsNumber, Min } from "class-validator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UsersService } from "./users.service";

class UpdateProfileDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
}

class ChangePasswordDto {
  @IsString() oldPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

class UpgradePlanDto {
  @IsIn(["PRO"]) plan: "PRO";
  @IsNumber() @Min(1) months: number;
}

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: { id: string }) {
    return this.users.findById(user.id);
  }

  @Put("me/profile")
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post("me/change-password")
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }

  @Post("me/upgrade")
  upgradePlan(@CurrentUser() user: { id: string }, @Body() dto: UpgradePlanDto) {
    return this.users.upgradePlan(user.id, dto.plan, dto.months);
  }
}
