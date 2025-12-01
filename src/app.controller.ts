import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint - redirects to web app' })
  getRoot(@Res() res: Response) {
    // Serve the index.html from static files, or return API info
    res.json({
      message: 'Bungie Hub API',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        docs: '/api-docs',
        api: '/api/v1',
      },
    });
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return this.appService.getHealth();
  }
}
