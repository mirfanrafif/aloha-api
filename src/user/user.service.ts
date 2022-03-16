import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { CustomerService } from 'src/customer/customer.service';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import { UpdateUserRequestDto } from './user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    private customerService: CustomerService,
  ) {}

  async findUser(id: number) {
    return await this.userRepository.findOne(id);
  }

  async getCurrentUser(id: number): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOneOrFail(id, {
      relations: ['job'],
    });
    return {
      success: true,
      data: user,
      message: 'Success getting profile data with user id ' + id,
    };
  }

  async getCustomerByAgentId(user: UserEntity, lastCustomerId?: number) {
    const messages = await this.customerService.getCustomerByAgent({
      agent: user,
      lastCustomerId,
    });
    const result = {
      success: true,
      data: messages,
      message: `Success getting customer list by agent id ${user.id}`,
    };
    return result;
  }

  async updateProfile(user: UserEntity, request: UpdateUserRequestDto) {
    const currentUser = await this.userRepository.findOneOrFail(user.id);
    currentUser.full_name = request.full_name;
    currentUser.email = request.email;
    currentUser.password =
      request.password !== undefined
        ? await hash(request.password, 10)
        : user.password;
    currentUser.username = request.username;
    const finalUser = await this.userRepository.save(currentUser);
    return finalUser;
  }

  async updateProfilePhoto(file: Express.Multer.File, user: UserEntity) {
    const fileType = /image\/(.*)/gi.exec(file.mimetype);
    if (fileType === null) {
      throw new BadRequestException();
    }
    user.profile_photo = file.filename;
    return await this.userRepository.save(user);
  }
}
