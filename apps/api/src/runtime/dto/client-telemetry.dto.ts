import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested
} from 'class-validator';

class ClientTelemetryEventDto {
  @IsString()
  @MaxLength(80)
  eventName!: string;

  @IsString()
  ts!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  turnId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class ClientTelemetryBatchDto {
  @IsString()
  deviceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientTelemetryEventDto)
  events!: ClientTelemetryEventDto[];
}
