import { IsString, Matches, Length } from "class-validator";

export class VerifyOtpDto {
  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  phone: string;

  @IsString()
  @Length(6, 6, { message: "کد OTP باید ۶ رقم باشد" })
  code: string;
}
