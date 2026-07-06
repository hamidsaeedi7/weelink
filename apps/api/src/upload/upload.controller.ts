import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

function makeStorage(subDir: string) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(UPLOAD_DIR, subDir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new BadRequestException("فقط فایل‌های تصویری مجاز هستند"), false);
};

const videoFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = [".mp4", ".webm", ".mov", ".ogg"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new BadRequestException("فقط فایل‌های ویدیویی مجاز هستند"), false);
};

// Digital-product files: archives, documents, design & media files.
const DIGITAL_FILE_EXTS = [
  ".zip", ".rar", ".esd", ".ai", ".jpeg", ".jpg", ".mp3", ".fig", ".figma",
  ".pdf", ".xlsx", ".xls", ".pptx", ".ppt", ".docx", ".doc",
];
const digitalFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (DIGITAL_FILE_EXTS.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new BadRequestException("فرمت فایل مجاز نیست"), false);
};

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post("image")
  @UseInterceptors(FileInterceptor("file", {
    storage: makeStorage("images"),
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File, @CurrentUser() _u: any) {
    if (!file) throw new BadRequestException("فایلی انتخاب نشده");
    return { url: `/uploads/images/${file.filename}`, filename: file.filename, size: file.size };
  }

  @Post("video")
  @UseInterceptors(FileInterceptor("file", {
    storage: makeStorage("videos"),
    fileFilter: videoFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  uploadVideo(@UploadedFile() file: Express.Multer.File, @CurrentUser() _u: any) {
    if (!file) throw new BadRequestException("فایلی انتخاب نشده");
    return { url: `/uploads/videos/${file.filename}`, filename: file.filename, size: file.size };
  }

  @Post("file")
  @UseInterceptors(FileInterceptor("file", {
    storage: makeStorage("files"),
    fileFilter: digitalFileFilter,
    limits: { fileSize: 500 * 1024 * 1024 },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File, @CurrentUser() _u: any) {
    if (!file) throw new BadRequestException("فایلی انتخاب نشده");
    return {
      url: `/uploads/files/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
