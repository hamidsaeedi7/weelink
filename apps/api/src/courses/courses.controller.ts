import { BadRequestException, Body, Controller, Delete, Get, Headers, NotFoundException, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { CoursesService } from "./courses.service";
import { PurchaseCourseDto, RedeemLicenseDto } from "./dto/course.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

@Controller("shops/:slug/courses")
export class CoursesPublicController {
  constructor(private svc: CoursesService) {}
  @Get() findPublic(@Param("slug") slug: string) { return this.svc.findAllPublic(slug); }

  @Post(":id/purchase")
  purchase(@Param("slug") slug: string, @Param("id") id: string, @Body() dto: PurchaseCourseDto) {
    return this.svc.purchase(slug, id, dto);
  }
}

@Controller("courses/license")
export class CourseLicenseController {
  constructor(private svc: CoursesService) {}

  @Post("redeem")
  redeem(@Body() dto: RedeemLicenseDto) {
    return this.svc.redeemLicense(dto);
  }
}

@Controller("courses/:courseId/chapters/:chapterId")
export class CourseVideoController {
  constructor(private svc: CoursesService) {}

  @Get("video-url")
  getVideoUrl(
    @Param("courseId") courseId: string,
    @Param("chapterId") chapterId: string,
    @Query("video") video: string,
    @Query("accessToken") accessToken: string,
  ) {
    return this.svc.getSignedVideoUrl(courseId, chapterId, Number(video) || 0, accessToken);
  }
}

@Controller("stream")
export class StreamController {
  constructor(private svc: CoursesService) {}

  @Get("video")
  async streamVideo(
    @Query("token") token: string,
    @Headers("range") range: string | undefined,
    @Res() res: Response,
  ) {
    const relPath = this.svc.verifyStreamToken(token);
    const absPath = path.join(UPLOAD_DIR, relPath.replace(/^\/uploads\//, ""));

    if (!absPath.startsWith(UPLOAD_DIR) || !fs.existsSync(absPath)) {
      throw new NotFoundException("ویدیو یافت نشد");
    }

    const stat = fs.statSync(absPath);
    const ext = path.extname(absPath).slice(1).toLowerCase();
    const contentType = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", ogg: "video/ogg", mkv: "video/x-matroska", m4v: "video/x-m4v" }[ext] || "application/octet-stream";

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (!match) throw new BadRequestException("Range header نامعتبر است");
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      if (start >= stat.size || end >= stat.size || start > end) {
        res.status(416).set({ "Content-Range": `bytes */${stat.size}` }).end();
        return;
      }
      res.status(206).set({
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1),
        "Content-Type": contentType,
      });
      fs.createReadStream(absPath, { start, end }).pipe(res);
    } else {
      res.status(200).set({
        "Content-Length": String(stat.size),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(absPath).pipe(res);
    }
  }
}

@Controller("courses")
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private svc: CoursesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) { return this.svc.findAll(user.id); }

  @Get("enrollments")
  findEnrollments(@CurrentUser() user: { id: string }) { return this.svc.findEnrollmentsForOwner(user.id); }

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
