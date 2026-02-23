import { Body, Controller, Post } from '@nestjs/common';
import { TurnDto } from './dto/turn.dto';
import { TurnsService } from './services/turns.service';

@Controller('turns')
export class TurnsController {
  constructor(private readonly turnsService: TurnsService) {}

  @Post()
  async processTurn(@Body() dto: TurnDto) {
    return this.turnsService.processTurn(dto);
  }
}
