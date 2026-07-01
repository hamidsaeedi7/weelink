import { IsDateString, IsEmail, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreateBookingDto {
  @IsString()
  serviceId: string;

  @IsString()
  @MaxLength(100)
  customerName: string;

  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  customerPhone: string;

  @IsOptional()
  @IsEmail({}, { message: "ایمیل معتبر نیست" })
  customerEmail?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
