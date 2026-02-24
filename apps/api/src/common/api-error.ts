import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export class ApiError {
  static capsuleNotFound(capsuleId: string): NotFoundException {
    return new NotFoundException({
      code: 'CAPSULE_NOT_FOUND',
      message: `Capsule ${capsuleId} not found`
    });
  }

  static sessionNotFound(sessionId: string): NotFoundException {
    return new NotFoundException({
      code: 'SESSION_NOT_FOUND',
      message: `Session ${sessionId} not found`
    });
  }

  static invalidAction(message: string): BadRequestException {
    return new BadRequestException({ code: 'INVALID_ACTION', message });
  }

  static sessionConflict(message = 'Concurrent turn update conflict'): ConflictException {
    return new ConflictException({ code: 'SESSION_CONFLICT', message });
  }

  static presetNotFound(presetId: string): BadRequestException {
    return new BadRequestException({
      code: 'PRESET_NOT_FOUND',
      message: `Preset ${presetId} not found`
    });
  }

  static deviceIdRequired(): BadRequestException {
    return new BadRequestException({
      code: 'DEVICE_ID_REQUIRED',
      message: 'x-tmb-device-id header is required'
    });
  }

  static deviceIdInvalid(): BadRequestException {
    return new BadRequestException({
      code: 'DEVICE_ID_INVALID',
      message: 'x-tmb-device-id must be a valid UUID'
    });
  }
}
