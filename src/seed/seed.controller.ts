import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Auth } from '../auth/decorators/auth.decorators';
import { ValidRoles } from '../auth/interfaces/valid-roles';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  @Auth( ValidRoles.admin )
  findAll() {
    return this.seedService.runSeed();
  }
}
