import { IsString, IsOptional, MaxLength, IsObject, IsNotEmpty } from "class-validator";

export class CreateStoryProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  /**
   * The whole editor document. Deliberately validated only as "an object" —
   * the shape is owned by the client-side editor and is versioned inside the
   * payload itself, so mirroring it in server DTOs would mean touching the
   * API on every editor change. Size is bounded in the service instead.
   */
  @IsObject()
  @IsNotEmpty()
  doc!: Record<string, any>;

  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class UpdateStoryProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsObject()
  doc?: Record<string, any>;

  @IsOptional()
  @IsString()
  thumbnail?: string;
}
