import { Document, Types } from 'mongoose';
export declare enum ActivityType {
    LOGIN = "login",
    LOGOUT = "logout",
    PROFILE_UPDATE = "profile_update",
    PASSWORD_CHANGE = "password_change",
    EMAIL_CHANGE = "email_change"
}
export declare class Activity extends Document {
    userId: Types.ObjectId;
    type: ActivityType;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ActivitySchema: import("mongoose").Schema<Activity, import("mongoose").Model<Activity, any, any, any, Document<unknown, any, Activity> & Activity & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Activity, Document<unknown, {}, import("mongoose").FlatRecord<Activity>> & import("mongoose").FlatRecord<Activity> & {
    _id: Types.ObjectId;
}>;
