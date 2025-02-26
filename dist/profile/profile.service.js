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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const user_schema_1 = require("../auth/schemas/user.schema");
const activity_schema_1 = require("./schemas/activity.schema");
let ProfileService = class ProfileService {
    constructor(userModel, activityModel) {
        this.userModel = userModel;
        this.activityModel = activityModel;
    }
    async getProfile(userId) {
        const user = await this.userModel.findById(userId).select('-password -refreshToken');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user._id,
            email: user.email,
            name: user.name,
        };
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updates = {};
        const activityMetadata = {};
        if (updateProfileDto.email && updateProfileDto.email !== user.email) {
            if (!updateProfileDto.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to update email');
            }
            const isPasswordValid = await bcrypt.compare(updateProfileDto.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid current password');
            }
            const existingUser = await this.userModel.findOne({ email: updateProfileDto.email });
            if (existingUser) {
                throw new common_1.BadRequestException('Email already in use');
            }
            updates.email = updateProfileDto.email;
            activityMetadata.emailChanged = {
                from: user.email,
                to: updateProfileDto.email,
            };
        }
        if (updateProfileDto.newPassword) {
            if (!updateProfileDto.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to update password');
            }
            const isPasswordValid = await bcrypt.compare(updateProfileDto.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid current password');
            }
            updates.password = await bcrypt.hash(updateProfileDto.newPassword, 10);
            activityMetadata.passwordChanged = true;
        }
        if (updateProfileDto.name) {
            updates.name = updateProfileDto.name;
            activityMetadata.nameChanged = {
                from: user.name,
                to: updateProfileDto.name,
            };
        }
        if (Object.keys(updates).length > 0) {
            await this.userModel.updateOne({ _id: userId }, { $set: updates });
            await this.activityModel.create({
                userId,
                type: activity_schema_1.ActivityType.PROFILE_UPDATE,
                metadata: activityMetadata,
            });
        }
        return {
            message: 'Profile updated successfully',
            updates: Object.keys(updates),
        };
    }
    async deleteAccount(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.activityModel.create({
            userId,
            type: 'account_deletion',
            metadata: {
                email: user.email,
                deletedAt: new Date(),
            },
        });
        await this.userModel.deleteOne({ _id: userId });
        return { message: 'Account deleted successfully' };
    }
    async getActivityLog(userId) {
        const activities = await this.activityModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        return {
            activities: activities.map(activity => ({
                type: activity.type,
                metadata: activity.metadata,
                timestamp: activity.createdAt,
            })),
        };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(activity_schema_1.Activity.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ProfileService);
//# sourceMappingURL=profile.service.js.map