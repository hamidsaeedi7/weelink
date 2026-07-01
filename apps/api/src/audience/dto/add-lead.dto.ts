import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class AddLeadDto {
  @IsEmail({}, { message: "ایمیل معتبر نیست" })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}
