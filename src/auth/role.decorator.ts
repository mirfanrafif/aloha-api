import { SetMetadata } from '@nestjs/common';
import { Role } from '../core/repository/user/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (role: Role) => SetMetadata(ROLES_KEY, role);
