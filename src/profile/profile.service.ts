import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/schemas/user.schema';
import { Activity, ActivityType } from './schemas/activity.schema';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user._id,
      email: user.email,
      name: user.name,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updates: any = {};
    const activityMetadata: any = {};

    // Handle email update
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      if (!updateProfileDto.currentPassword) {
        throw new BadRequestException('Current password is required to update email');
      }

      const isPasswordValid = await bcrypt.compare(updateProfileDto.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      const existingUser = await this.userModel.findOne({ email: updateProfileDto.email });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }

      updates.email = updateProfileDto.email;
      activityMetadata.emailChanged = {
        from: user.email,
        to: updateProfileDto.email,
      };
    }

    // Handle password update
    if (updateProfileDto.newPassword) {
      if (!updateProfileDto.currentPassword) {
        throw new BadRequestException('Current password is required to update password');
      }

      const isPasswordValid = await bcrypt.compare(updateProfileDto.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      updates.password = await bcrypt.hash(updateProfileDto.newPassword, 10);
      activityMetadata.passwordChanged = true;
    }

    // Handle name update
    if (updateProfileDto.name) {
      updates.name = updateProfileDto.name;
      activityMetadata.nameChanged = {
        from: user.name,
        to: updateProfileDto.name,
      };
    }

    if (Object.keys(updates).length > 0) {
      await this.userModel.updateOne({ _id: userId }, { $set: updates });
      
      // Log the activity
      await this.activityModel.create({
        userId,
        type: ActivityType.PROFILE_UPDATE,
        metadata: activityMetadata,
      });
    }

    return {
      message: 'Profile updated successfully',
      updates: Object.keys(updates),
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log the deletion activity before deleting the user
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

  async getActivityLog(userId: string) {
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
}
