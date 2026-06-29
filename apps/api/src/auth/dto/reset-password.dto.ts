import { IsString, MinLength, Length } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @Length(6, 6, { message: "کد تأیید باید ۶ رقم باشد" })
  code: string;

  @IsString()
  @MinLength(8, { message: "رمز عبور حداقل ۸ کاراکتر باشد" })
  newPassword: string;
}
