import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll({
    limit = 20,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    return this.usersRepository.findAll(limit, offset);
  }

  async findById(id: string): Promise<User> {
    try {
      return await this.usersRepository.findByIdOrThrow(id);
    } catch {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
