import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './schemas/user.schema';
import { OTP } from './schemas/otp.schema';
import { RegisterDto, LoginDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthService {
    private userModel;
    private otpModel;
    private jwtService;
    private configService;
    private transporter;
    private readonly isDevOrUat;
    private readonly defaultOtp;
    constructor(userModel: Model<User>, otpModel: Model<OTP>, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: string;
            name: string;
        };
    } | {
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        email: string;
        accessToken?: undefined;
        refreshToken?: undefined;
        user?: undefined;
    } | {
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: string;
            name: string;
        };
        message?: undefined;
        email?: undefined;
    }>;
    verifyOTP(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: string;
            name: string;
        };
    }>;
    sendOTP(email: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    private generateAccessToken;
    private generateRefreshToken;
}
