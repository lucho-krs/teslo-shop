import { Controller, Get, Post, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { RawHeaders } from './decorators/raw-header.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser( @Body() createUserDto: CreateUserDto ) {
    return this.authService.create( createUserDto );
  }

  @Post('login')
  loginUser( @Body() loginUserDto: LoginUserDto ) {
    return this.authService.login( loginUserDto );
  }

  @Get('private')
  @UseGuards( AuthGuard() )
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[]
  ) {
    return {
      ok: true,
      message: 'Holaa mundo',
      user,
      userEmail,
      rawHeaders
    }
  }

  @Get('private2')
  @SetMetadata('roles', ['admin', 'super-user'])
  @UseGuards( AuthGuard(), UserRoleGuard )
  privateRoute2(
    @GetUser() user: User,
  ) {
    return {
      ok: true,
      user
    }
  }
}
