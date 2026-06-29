import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("shops/:slug/courses")
export class CoursesPublicController {
  constructor(private svc: CoursesService) {}
  @Get() findPublic(@Param("slug") slug: string) { return this.svc.findAllPublic(slug); }
}

@Controller("courses")
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private svc: CoursesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: any) { return this.svc.create(user.id, dto); }

  @Put(":id")
  update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: any) {
    return this.svc.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) { return this.svc.remove(user.id, id); }

  // Chapters
  @Get(":courseId/chapters")
  getChapters(@CurrentUser() user: { id: string }, @Param("courseId") cid: string) {
    return this.svc.getChapters(user.id, cid);
  }

  @Post(":courseId/chapters")
  createChapter(@CurrentUser() user: { id: string }, @Param("courseId") cid: string, @Body() dto: any) {
    return this.svc.createChapter(user.id, cid, dto);
  }

  @Put("chapters/:chapterId")
  updateChapter(@CurrentUser() user: { id: string }, @Param("chapterId") chId: string, @Body() dto: any) {
    return this.svc.updateChapter(user.id, chId, dto);
  }

  @Delete("chapters/:chapterId")
  removeChapter(@CurrentUser() user: { id: string }, @Param("chapterId") chId: string) {
    return this.svc.removeChapter(user.id, chId);
  }
}
