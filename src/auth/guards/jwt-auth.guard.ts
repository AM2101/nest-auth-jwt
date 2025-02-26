import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      request.user = payload;
      return true;
    } catch (error) {
      // If token is expired and there's a refresh token, try to refresh
      if (error.name === 'TokenExpiredError' && request.headers['refresh-token']) {
        try {
          const refreshToken = request.headers['refresh-token'];
          const response = await fetch(`${request.protocol}://${request.get('host')}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new UnauthorizedException('Invalid refresh token');
          }

          const { accessToken } = await response.json();
          
          // Update the request headers with the new access token
          request.headers.authorization = `Bearer ${accessToken}`;
          
          // Verify the new token
          const payload = await this.jwtService.verifyAsync(accessToken, {
            secret: this.configService.get<string>('JWT_SECRET'),
          });
          request.user = payload;
          return true;
        } catch (refreshError) {
          throw new UnauthorizedException('Failed to refresh token');
        }
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
