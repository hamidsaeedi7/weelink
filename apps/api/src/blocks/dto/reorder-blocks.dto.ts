import { IsArray, IsString } from "class-validator";

export class ReorderBlocksDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
