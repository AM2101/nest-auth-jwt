import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'The current password (required for email update)',
    example: 'currentPassword123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @ApiProperty({
    description: 'The new password',
    example: 'newPassword123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
