import { IsString, MinLength } from "class-validator";

export class SetPasswordDto {
  @IsString()
  @MinLength(8, { message: "رمز عبور حداقل ۸ کاراکتر باشد" })
  password: string;
}
