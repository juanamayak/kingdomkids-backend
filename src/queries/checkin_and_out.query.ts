import {Op} from 'sequelize';
import {CheckInAndOutModel} from '../models/checkin_and_out.model';
import {KidsModel} from "../models/kids.model";
import moment from "moment";

export class CheckinAndOutQuery {

    public async index() {
        try {
            const checkins = await CheckInAndOutModel.findAll();
            return {ok: true, checkins}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async show(checkinId: any) {
        try {
            const checkin = await CheckInAndOutModel.findOne({
                where: {
                    id: checkinId
                }
            })
            return {ok: true, checkin}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async showByRegister(registerId: any) {
        try {
            const checkin = await CheckInAndOutModel.findOne({
                where: {
                    register_id: registerId,
                    status: 1,
                },
                order: [ [ 'createdAt', 'DESC' ]]
            })
            return {ok: true, checkin}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async indexByRegister(registerId: any) {
        try {
            const checkins = await CheckInAndOutModel.findAll({
                where: {
                    register_id: registerId
                }
            })
            return {ok: true, checkins}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async checkin(data: any) {
        try {
            const record = {
                register_id: data.register_id,
                checkin_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                status: 1,
                createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            const checkin = await CheckInAndOutModel.create(record);
            return {ok: true, checkin}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async checkout(checkinId: any, data: any) {
        try {
            const checkout = await CheckInAndOutModel.update(
                data,
                {
                    where: {
                        id: checkinId
                    }
                }
            );
            return {ok: true}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }
}
