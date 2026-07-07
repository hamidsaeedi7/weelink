import { IsString, MaxLength, MinLength, IsOptional } from "class-validator";

export class CreateBankCardDto {
  @IsString()
  @MinLength(16, { message: "شماره کارت نامعتبر است" })
  @MaxLength(30)
  cardNumber: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  cardHolder: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  bankName: string;
}

export class UpdateBankCardDto {
  @IsOptional()
  @IsString()
  @MinLength(16, { message: "شماره کارت نامعتبر است" })
  @MaxLength(30)
  cardNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  cardHolder?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  bankName?: string;
}
