import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './api-error';
import { isValidDeviceId, type RequestWithDeviceId } from './device-id';

function isDeviceOptionalPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/health' ||
    pathname === '/ready' ||
    pathname === '/docs' ||
    pathname === '/openapi.json' ||
    pathname === '/api/docs' ||
    pathname.startsWith('/api/docs/') ||
    pathname === '/meta/routes' ||
    pathname.startsWith('/admin')
  );
}

export function deviceIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (isDeviceOptionalPath(req.path)) {
    next();
    return;
  }

  const headerValue = req.header('x-tmb-device-id');
  const deviceId = headerValue?.trim();
  if (!deviceId) {
    next(ApiError.deviceIdRequired());
    return;
  }
  if (!isValidDeviceId(deviceId)) {
    next(ApiError.deviceIdInvalid());
    return;
  }

  (req as RequestWithDeviceId).tmbDeviceId = deviceId;
  next();
}
