"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config_1 = require("@nestjs/config");
const user_schema_1 = require("./schemas/user.schema");
const otp_schema_1 = require("./schemas/otp.schema");
let AuthService = class AuthService {
    constructor(userModel, otpModel, jwtService, configService) {
        this.userModel = userModel;
        this.otpModel = otpModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.defaultOtp = '0000';
        const env = this.configService.get('NODE_ENV');
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
    async register(registerDto) {
        const { email, password, name } = registerDto;
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new common_1.BadRequestException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.userModel.create({
            email,
            password: hashedPassword,
            name,
            isVerified: false,
        });
        await this.sendOTP(email);
        if (this.isDevOrUat) {
            return this.verifyOTP({ email, otp: this.defaultOtp });
        }
        return {
            message: this.isDevOrUat
                ? 'Registration successful. Use OTP: 0000 to verify.'
                : 'Registration successful. Please check your email for OTP.'
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isVerified) {
            await this.sendOTP(email);
            if (this.isDevOrUat) {
                return {
                    message: 'Use OTP: 0000 to verify your account',
                    email: user.email
                };
            }
            throw new common_1.UnauthorizedException('Please verify your email first. Check your email for OTP.');
        }
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user),
        ]);
        await this.userModel.updateOne({ _id: user._id }, { refreshToken: await bcrypt.hash(refreshToken, 10) });
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
    async verifyOTP(verifyOtpDto) {
        const { email, otp } = verifyOtpDto;
        if (this.isDevOrUat && otp === this.defaultOtp) {
            await this.userModel.updateOne({ email }, { isVerified: true });
            const user = await this.userModel.findOne({ email });
            const [accessToken, refreshToken] = await Promise.all([
                this.generateAccessToken(user),
                this.generateRefreshToken(user),
            ]);
            await this.userModel.updateOne({ _id: user._id }, { refreshToken: await bcrypt.hash(refreshToken, 10) });
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
        const otpRecord = await this.otpModel.findOne({
            email,
            expiresAt: { $gt: new Date() },
        });
        if (!otpRecord || otpRecord.otp !== otp) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        await this.userModel.updateOne({ email }, { isVerified: true });
        await this.otpModel.deleteOne({ _id: otpRecord._id });
        const user = await this.userModel.findOne({ email });
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user),
        ]);
        await this.userModel.updateOne({ _id: user._id }, { refreshToken: await bcrypt.hash(refreshToken, 10) });
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
    async sendOTP(email) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + this.configService.get('OTP_EXPIRY'));
        const otp = this.isDevOrUat ? this.defaultOtp : Math.floor(100000 + Math.random() * 900000).toString();
        await this.otpModel.findOneAndUpdate({ email }, {
            email,
            otp,
            expiresAt,
        }, { upsert: true, new: true });
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
    async refreshToken(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('REFRESH_TOKEN_SECRET'),
            });
            const user = await this.userModel.findById(payload.sub);
            if (!user || !user.refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!isRefreshTokenValid) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const accessToken = await this.generateAccessToken(user);
            return { accessToken };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId) {
        await this.userModel.updateOne({ _id: userId }, {
            $unset: { refreshToken: 1 },
            $set: { lastLogout: new Date() }
        });
        return { message: 'Logged out successfully' };
    }
    async generateAccessToken(user) {
        const payload = { sub: user._id, email: user.email };
        return this.jwtService.signAsync(payload);
    }
    async generateRefreshToken(user) {
        const payload = { sub: user._id };
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION'),
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(otp_schema_1.OTP.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map