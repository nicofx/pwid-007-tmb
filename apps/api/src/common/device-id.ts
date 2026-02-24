import type { Request } from 'express';
import { ApiError } from './api-error';

export interface RequestWithDeviceId extends Request {
  tmbDeviceId?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDeviceId(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function getDeviceIdFromRequest(req: Request): string {
  const fromContext = (req as RequestWithDeviceId).tmbDeviceId;
  const fromHeader = req.header('x-tmb-device-id') ?? undefined;
  const candidate = fromContext ?? fromHeader;
  if (!candidate || candidate.trim().length === 0) {
    throw ApiError.deviceIdRequired();
  }
  if (!isValidDeviceId(candidate)) {
    throw ApiError.deviceIdInvalid();
  }
  return candidate;
}
