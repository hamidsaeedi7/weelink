import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";

export class SetPasswordDto {
  @IsString()
  @MinLength(8, { message: "رمز عبور حداقل ۸ کاراکتر باشد" })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "نام و نام خانوادگی را کامل وارد کنید" })
  @MaxLength(60)
  fullName?: string;
}
