import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserExposeFieldsInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<UserResponseDto | UserResponseDto[]> {
    return next.handle().pipe(
      map((data: User | User[]) => {
        if (Array.isArray(data)) {
          return data.map((user) => this.sanitizeUser(user));
        } else if (data && this.isUserEntity(data)) {
          return this.sanitizeUser(data);
        }
        // This shouldn't happen in our use case, but TypeScript requires handling all paths
        throw new Error('Unexpected data type in UserExposeFieldsInterceptor');
      }),
    );
  }

  private isUserEntity(obj: unknown): obj is User {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      obj !== undefined &&
      'id' in obj &&
      'email' in obj &&
      'password' in obj
    );
  }

  private sanitizeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
