import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyOtpDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
}
