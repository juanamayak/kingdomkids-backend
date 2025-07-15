import { Application } from 'express';

/* Controllers */
import { RegisterController } from '../controllers/register.controller';
import { CheckinAndOutController } from '../controllers/checkin_and_out.controller';
import { SessionController } from '../controllers/session.controller';


export class Routes {
    public registerController: RegisterController = new RegisterController();
    public checkinAndOutController: CheckinAndOutController = new CheckinAndOutController();
    public sessionController: SessionController = new SessionController();

    public routes(app: Application) {
        /* Routes for admins */
        app.route('/api/login').post(this.sessionController.login);

        /* Routes for kids register */
        app.route('/api/register').post(this.registerController.register);
        app.route('/api/register/:id').get(this.registerController.show);
        app.route('/api/finder').post(this.registerController.finder); // pendiente

        app.route('/api/register').get(this.registerController.index);
        app.route('/api/register/qr/:id').get(this.registerController.getQRCodeImage);
        app.route('/api/register/confirmation/:id').get(this.registerController.confirmation);

        /* Routes for check in and out*/
        app.route('/api/checkinAndOut/index').get(this.checkinAndOutController.indexToday);
        app.route('/api/checkinAndOut/index/:register_id').get(this.checkinAndOutController.indexByRegister);
        app.route('/api/checkinAndOut/:id').get(this.checkinAndOutController.showByRegister);
        app.route('/api/checkin').post(this.checkinAndOutController.checkin);
        app.route('/api/checkinAndOut/checkout/:id').put(this.checkinAndOutController.checkout);

        /* Reportes de niños por edades */
        app.route('/api/reports/:age').get(this.registerController.excelByAge);
    }
}
