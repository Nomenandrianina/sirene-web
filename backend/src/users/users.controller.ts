import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Req, UseGuards,UseInterceptors, UploadedFile, BadRequestException, } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { Public } from 'src/common/decarators/public.decorator';
import { GetUser } from './decorators/get-user-decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { Audit } from 'src/audit-log/decorators/audit.decorator';
import { avatarMulterConfig } from 'src/config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';

interface RequestWithUser extends Request {
  user: {
    userId: number;
  };
}

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}


  @Audit('CREATE', 'User')
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    return {
      status: 200,
      message: 'add_success',
      response: user,
    };
  }

  @Public()
  @Post("/signup")
  async signup(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.signup(createUserDto);

    return {
      status: 200,
      message: 'add_success',
      response: user,
    };
  }

  @Get('me/permissions')
  async getMyPermissions(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const permissions = await this.usersService.getUserPermissions(userId);
    
    return {
      status: 200,
      message: 'Permissions récupérées avec succès',
      response: permissions,
    };
  }

  @Get('profile')
  async getProfile(@GetUser() user: any) {
    const profile = await this.usersService.findOneWithRoleAndPermissions(user.sub);
    if (!profile) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Profil non trouvé',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    const { password, ...safeUser } = profile;
    return {
      status: 200,
      message: 'Profil récupéré avec succès',
        response: safeUser,
    };
  }

  @Put('update-user/:id')
  async updateUser(@Param('id') id:string, @Body() dto: UpdateUserDto) {
    const updatedUser = await this.usersService.updateUser(parseInt(id), dto);

    return {
      status: 200,
      message: 'saveSuccess',
      response: updatedUser,
    };
  }

  @Put('update-profile')
  async updateProfile(@GetUser() user: any, @Body() dto: UpdateProfileDto) {
    const updatedUser = await this.usersService.updateProfile(user.sub, dto);

    return {
      status: 200,
      message: 'saveSuccess',
      response: updatedUser,
    };
  }

  

  @Put('change-password')
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    const result = await this.usersService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);

    return {
      status: 200,
      message: 'Mot de passe modifié avec succès',
      response: result,
    };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      status: 200,
      message: 'Utilisateurs récupérés avec succès',
      response: users,
    };
  }

  // 🔸 Récupérer un utilisateur par ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Utilisateur non trouvé',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      status: 200,
      message: 'Utilisateur trouvé',
      response: user,
    };
  }

  // 🔸 Supprimer un utilisateur
  @Audit('DELETE', 'User')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Utilisateur non trouvé',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    await this.usersService.remove(+id);

    return {
      status: 200,
      message: 'Utilisateur supprimé avec succès',
    };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', avatarMulterConfig))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    const result = await this.usersService.updateAvatar(user.sub, file.filename);
    return {
      status: 200,
      message: 'Avatar mis à jour avec succès',
      response: result,
    };
  }

  // ── Supprimer avatar ──────────────────────────────────────────
  @Delete('avatar')
  async deleteAvatar(@GetUser() user: any) {
    const result = await this.usersService.deleteAvatar(user.sub);
    return {
      status: 200,
      message: result.message,
    };
  }
  
}
