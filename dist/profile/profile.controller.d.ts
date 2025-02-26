import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile.dto';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    getProfile(req: any): Promise<{
        id: any;
        email: string;
        name: string;
    }>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<{
        message: string;
        updates: string[];
    }>;
    deleteAccount(req: any): Promise<{
        message: string;
    }>;
    getActivityLog(req: any): Promise<{
        activities: {
            type: import("./schemas/activity.schema").ActivityType;
            metadata: Record<string, any>;
            timestamp: Date;
        }[];
    }>;
}
