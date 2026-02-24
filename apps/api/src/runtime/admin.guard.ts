import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();
    const provided = req.headers['x-admin-token'];
    const expected = process.env.ADMIN_TOKEN;

    if (!expected || expected.length === 0) {
      throw new UnauthorizedException({
        code: 'ADMIN_DISABLED',
        message: 'ADMIN_TOKEN is not configured'
      });
    }

    if (!provided || provided !== expected) {
      throw new UnauthorizedException({
        code: 'ADMIN_UNAUTHORIZED',
        message: 'Invalid admin token'
      });
    }

    return true;
  }
}
