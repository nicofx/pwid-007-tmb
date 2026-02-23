import { Type } from 'class-transformer';
import type { ActionVerb } from '@tmb/contracts';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

const ACTION_VERBS: ActionVerb[] = [
  'TALK',
  'SEARCH',
  'OBSERVE',
  'MOVE',
  'WAIT',
  'USE',
  'TAKE',
  'DROP'
];

class TurnActionDto {
  @IsOptional()
  @IsIn(ACTION_VERBS)
  verb?: ActionVerb;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifiers?: string[];
}

export class TurnDto {
  @IsString()
  sessionId!: string;

  @IsString()
  turnId!: string;

  @IsOptional()
  @IsString()
  playerText?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TurnActionDto)
  action?: TurnActionDto;
}
