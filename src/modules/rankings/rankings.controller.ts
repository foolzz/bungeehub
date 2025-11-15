import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RankingsService } from './rankings.service';

@ApiTags('rankings')
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get hub leaderboard' })
  async getLeaderboard() {
    return { message: 'Hub rankings - Coming in Phase 5' };
  }
}
