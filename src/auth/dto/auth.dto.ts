import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the account',
    example: 'password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'john@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the account',
    example: 'password123'
  })
  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'john@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The OTP received via email',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'john@example.com'
  })
  @IsEmail()
  email: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token to get a new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
