import { Document } from 'mongoose';
export declare class OTP extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
}
export declare const OTPSchema: import("mongoose").Schema<OTP, import("mongoose").Model<OTP, any, any, any, Document<unknown, any, OTP> & OTP & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OTP, Document<unknown, {}, import("mongoose").FlatRecord<OTP>> & import("mongoose").FlatRecord<OTP> & {
    _id: import("mongoose").Types.ObjectId;
}>;
