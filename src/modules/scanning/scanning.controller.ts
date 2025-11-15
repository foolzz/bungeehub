import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScanningService } from './scanning.service';

@ApiTags('scanning')
@Controller('scanning')
export class ScanningController {
  constructor(private readonly scanningService: ScanningService) {}

  @Post('package')
  @ApiOperation({ summary: 'Scan a package' })
  async scanPackage() {
    return { message: 'Package scanning - Coming in Phase 3' };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Scan a batch' })
  async scanBatch() {
    return { message: 'Batch scanning - Coming in Phase 3' };
  }
}
