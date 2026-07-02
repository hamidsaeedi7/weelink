import { Matches } from "class-validator";

export class ForgotPasswordDto {
  @Matches(/^09[0-9]{9}$/, { message: "شماره موبایل معتبر نیست" })
  phone: string;
}
