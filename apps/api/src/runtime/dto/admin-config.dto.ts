import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAdminConfigDto {
  @IsOptional()
  @IsIn(['placeholder', 'llm', 'hybrid'])
  narrativeMode?: 'placeholder' | 'llm' | 'hybrid';

  @IsOptional()
  @IsIn(['mock', 'http'])
  llmAdapter?: 'mock' | 'http';

  @IsOptional()
  @IsString()
  llmModel?: string;

  @IsOptional()
  @IsInt()
  @Min(200)
  @Max(20000)
  narrativeTimeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(10000)
  narrativeCacheSize?: number;

  @IsOptional()
  @IsString()
  llmBaseUrl?: string;

  @IsOptional()
  @IsString()
  llmApiKey?: string;

  @IsOptional()
  @IsBoolean()
  wedEnabled?: boolean;
}
