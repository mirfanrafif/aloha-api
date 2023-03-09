import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../core/repository/user/user.entity';
import { USER_REPOSITORY } from '../../core/repository/user/user.module';
import { ApiResponse } from '../../utils/apiresponse.dto';
import { Repository } from 'typeorm';
import { EditProfileRequestDto } from '../user.dto';

@Injectable()
export class UserProfileService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
  ) {}

  async editProfile(user: UserEntity, request: EditProfileRequestDto) {
    const currentUser = await this.userRepository.findOneOrFail({
      where: {
        id: user.id,
      },
    });
    currentUser.full_name = request.full_name;
    const finalUser = await this.userRepository.save(currentUser);
    return finalUser;
  }

  async getCurrentUser(id: number): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOneOrFail({
      where: {
        id: id,
      },
      relations: {
        job: {
          job: true,
        },
      },
    });
    return {
      success: true,
      data: user,
      message: 'Success getting profile data with user id ' + id,
    };
  }

  async updateProfilePhoto(file: Express.Multer.File, user: UserEntity) {
    user.profile_photo = file.filename;
    return await this.userRepository.save(user);
  }
}
