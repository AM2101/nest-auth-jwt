import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Activity, ActivityType } from './schemas/activity.schema';
import { SchemaFactory } from '@nestjs/mongoose';

const ActivitySchema = SchemaFactory.createForClass(Activity);

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
