import { IsString, MaxLength, IsOptional, IsEnum } from "class-validator";
import { TicketPriority } from "@prisma/client";

export class CreateTicketDto {
  @IsString()
  @MaxLength(120)
  subject: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class ReplyTicketDto {
  @IsString()
  @MaxLength(2000)
  message: string;
}
