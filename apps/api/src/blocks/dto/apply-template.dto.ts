import {
  IsArray, IsEnum, IsIn, IsObject, IsOptional, IsString, ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BlockType } from "@prisma/client";

export class TemplateBlockDto {
  @IsEnum(BlockType)
  type: BlockType;

  @IsOptional() @IsString()
  label?: string;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsString()
  icon?: string;

  @IsOptional() @IsObject()
  data?: Record<string, any>;
}

export class ApplyTemplateDto {
  @IsString()
  templateId: string;

  /**
   * "replace" wipes the current blocks (returning them so the client can offer
   * undo); "append" keeps them and adds the template underneath.
   */
  @IsIn(["replace", "append"])
  mode: "replace" | "append";

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateBlockDto)
  blocks: TemplateBlockDto[];

  // Styling is only applied in "replace" mode — in "append" the seller has
  // already chosen a look for the blocks they are keeping.
  @IsOptional() @IsString()
  bioTheme?: string;

  @IsOptional() @IsString()
  bioMode?: string;

  @IsOptional() @IsString()
  primaryColor?: string;
}

export class RestoreBlocksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateBlockDto)
  blocks: TemplateBlockDto[];

  @IsOptional() @IsString()
  bioTheme?: string;

  @IsOptional() @IsString()
  bioMode?: string;

  @IsOptional() @IsString()
  primaryColor?: string;
}
