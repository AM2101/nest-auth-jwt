import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { User } from './schemas/user.schema';
import { OTP } from './schemas/otp.schema';
import { RegisterDto, LoginDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;
  private readonly isDevOrUat: boolean;
  private readonly defaultOtp = '0000';

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(OTP.name) private otpModel: Model<OTP>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const env = this.configService.get<string>('NODE_ENV');
    this.isDevOrUat = env === 'DEV' || env === 'UAT';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      isVerified: false, // Always start as unverified
    });

    // Create OTP record
    await this.sendOTP(email);

    if (this.isDevOrUat) {
      // Auto-verify with default OTP in DEV/UAT
      return this.verifyOTP({ email, otp: this.defaultOtp });
    }

    return { 
      message: this.isDevOrUat 
        ? 'Registration successful. Use OTP: 0000 to verify.' 
        : 'Registration successful. Please check your email for OTP.' 
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      // Create OTP record
      await this.sendOTP(email);

      if (this.isDevOrUat) {
        return {
          message: 'Use OTP: 0000 to verify your account',
          email: user.email
        };
      }

      throw new UnauthorizedException('Please verify your email first. Check your email for OTP.');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    await this.userModel.updateOne(
      { _id: user._id },
      { refreshToken: await bcrypt.hash(refreshToken, 10) }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async verifyOTP(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;
    
    // For DEV/UAT environments, always accept default OTP
    if (this.isDevOrUat && otp === this.defaultOtp) {
      await this.userModel.updateOne({ email }, { isVerified: true });
      const user = await this.userModel.findOne({ email });
      
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(user),
        this.generateRefreshToken(user),
      ]);

      await this.userModel.updateOne(
        { _id: user._id },
        { refreshToken: await bcrypt.hash(refreshToken, 10) }
      );

      return {
        message: 'Email verified successfully',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      };
    }

    // For production, verify against stored OTP
    const otpRecord = await this.otpModel.findOne({
      email,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord || otpRecord.otp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.userModel.updateOne({ email }, { isVerified: true });
    await this.otpModel.deleteOne({ _id: otpRecord._id });

    const user = await this.userModel.findOne({ email });
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    await this.userModel.updateOne(
      { _id: user._id },
      { refreshToken: await bcrypt.hash(refreshToken, 10) }
    );

    return {
      message: 'Email verified successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async sendOTP(email: string) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.configService.get<number>('OTP_EXPIRY'));
    
    const otp = this.isDevOrUat ? this.defaultOtp : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Always create/update OTP record
    await this.otpModel.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    // Only send email in production
    if (!this.isDevOrUat) {
      await this.transporter.sendMail({
        to: email,
        subject: 'Your OTP for verification',
        text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
      });
    }

    return { 
      message: this.isDevOrUat 
        ? 'Development/UAT environment - use OTP: 0000' 
        : 'OTP sent successfully to your email' 
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = await this.generateAccessToken(user);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Clear the refresh token from the user document
    await this.userModel.updateOne(
      { _id: userId },
      { 
        $unset: { refreshToken: 1 },
        $set: { lastLogout: new Date() }  // Track last logout time
      }
    );

    return { message: 'Logged out successfully' };
  }

  private async generateAccessToken(user: User) {
    const payload = { sub: user._id, email: user.email };
    return this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(user: User) {
    const payload = { sub: user._id };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION'),
    });
  }
}
