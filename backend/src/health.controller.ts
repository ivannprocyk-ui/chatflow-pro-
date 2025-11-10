import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: process.env.USE_DATABASE === 'true' ? 'postgresql' : 'mock',
      flowise: process.env.FLOWISE_API_URL ? 'configured' : 'not configured',
    };
  }
}
