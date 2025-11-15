import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PackagesService } from './packages.service';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a package' })
  async createPackage() {
    return { message: 'Package creation - Coming in Phase 3' };
  }

  @Get()
  @ApiOperation({ summary: 'List packages' })
  async listPackages() {
    return { message: 'Package listing - Coming in Phase 3' };
  }
}
