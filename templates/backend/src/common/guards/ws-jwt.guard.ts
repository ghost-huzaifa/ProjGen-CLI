import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      
      // Check if user data is already attached to socket
      if (client.data?.userId) {
        return true;
      }
      
      // Get token from socket handshake
      const token = client.handshake.auth.token || 
                    client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn('No token provided for WebSocket connection');
        throw new WsException('Unauthorized');
      }
      
      // Verify the token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      
      // Set user data on socket
      client.data.userId = payload.sub;
      client.data.roles = payload.roles;
      
      return true;
    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      throw new WsException('Unauthorized');
    }
  }
} 