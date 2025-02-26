import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { Activity, ActivityType } from './schemas/activity.schema';
import { UpdateProfileDto } from './dto/profile.dto';
export declare class ProfileService {
    private userModel;
    private activityModel;
    constructor(userModel: Model<User>, activityModel: Model<Activity>);
    getProfile(userId: string): Promise<{
        id: any;
        email: string;
        name: string;
    }>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{
        message: string;
        updates: string[];
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    getActivityLog(userId: string): Promise<{
        activities: {
            type: ActivityType;
            metadata: Record<string, any>;
            timestamp: Date;
        }[];
    }>;
}
