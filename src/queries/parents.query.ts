import {Op} from 'sequelize';
import {KidsModel} from '../models/kids.model';
import {CheckInAndOutModel} from "../models/checkin_and_out.model";
import moment from "moment";
import {ParentsModel} from "../models/parents.model";

export class ParentsQueries {

    public async find(name: any) {
        try {
            const register = await KidsModel.findOne({
                where: {
                    name: name
                }
            })
            return {ok: true, register}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async show(registerId: any) {
        try {
            const register = await KidsModel.findOne({
                where: {
                    id: registerId
                }
            })
            return {ok: true, register}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async index() {
        try {
            const registers = await KidsModel.findAll({
                include: [
                    {
                        model: CheckInAndOutModel,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
            return {ok: true, registers}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async register(data: any) {
        try {
            const parent = await ParentsModel.create(data);
            return {ok: true, parent}
        } catch (e) {
            console.log('Error al registrar:', e);
            return {ok: false}
        }
    }

    public async update(registerId: any, data: any) {
        try {
            const register = await KidsModel.update(
                data,
                {
                    where: {
                        id: registerId
                    }
                }
            );
            return {ok: true}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async indexByAge(age: any){
        try {
            const registers = await KidsModel.findAll({
                where: {
                    kid_age: age
                },
                include: [
                    {
                        model: CheckInAndOutModel,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
            return {ok: true, registers}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }
}
