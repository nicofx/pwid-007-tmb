import { IsOptional, IsString } from 'class-validator';

export class StartSessionDto {
  @IsString()
  capsuleId!: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  presetId?: string;

  @IsOptional()
  @IsString()
  seed?: string;
}
