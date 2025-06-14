import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {KidsController} from './kids/kids.controller';
import {UsersController} from './users/users.controller';
import {RolesController} from './roles/roles.controller';
import {AuthorizedPersonController} from './authorized_person/authorized_person.controller';
import {CheckinRegisterController} from './checkin_register/checkin_register.controller';
import {ParentsController} from './parents/parents.controller';
import {UsersModule} from './users/users.module';
import {KidsModule} from './kids/kids.module';
import {RolesModule} from './roles/roles.module';
import {ParentsModule} from './parents/parents.module';
import {CheckinRegisterModule} from './checkin_register/checkin_register.module';
import {AuthorizedPersonModule} from './authorized_person/authorized_person.module';

@Module({
    imports: [
        UsersModule,
        KidsModule,
        RolesModule,
        ParentsModule,
        CheckinRegisterModule,
        AuthorizedPersonModule
    ],
    controllers: [
        AppController,
        KidsController,
        UsersController,
        RolesController,
        AuthorizedPersonController,
        CheckinRegisterController,
        ParentsController],
    providers: [AppService],
})
export class AppModule {
}
