import {Op} from 'sequelize';
import {KidsModel} from '../models/kids.model';
import {CheckInAndOutModel} from "../models/checkin_and_out.model";
import moment from "moment";
import {ParentsModel} from "../models/parents.model";
import {AuthorizedModel} from "../models/authorized.model";

export class KidsQuery {

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
                },
                include: [
                    {
                        model: ParentsModel, as: 'parents'
                    },
                    {
                        model: AuthorizedModel, as: 'authorized'
                    }
                ]
            })
            return {ok: true, register}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async index() {
        try {
            const kids = await KidsModel.findAll(
                {
                    include: [
                        {
                            model: ParentsModel, as: 'parents'
                        },
                        {
                            model: AuthorizedModel, as: 'authorized'
                        }
                    ]
                }
            );
            return {ok: true, kids}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async register(data: any) {
        try {
            const kid = await KidsModel.create(data);
            return {ok: true, kid}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async update(registerId: any, data: any) {
        try {
            const kid = await KidsModel.update(
                data,
                {
                    where: {
                        id: registerId
                    }
                }
            );
            return {ok: true, kid}
        } catch (e) {
            console.log(e);
            return {ok: false}
        }
    }

    public async indexByDateRange(startDate: string, endDate: string) {
        try {
            const registers = await KidsModel.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
                    },
                },
                include: [
                    { model: ParentsModel, as: 'parents' },
                    { model: AuthorizedModel, as: 'authorized' },
                ],
                order: [['createdAt', 'ASC']],
            });
            return { ok: true, registers };
        } catch (e) {
            console.log(e);
            return { ok: false };
        }
    }

    public async indexByAge(age: any){
        try {
            const registers = await KidsModel.findAll({
                where: {
                    age
                },
                include: [
                    {
                        model: ParentsModel, as: 'parents'
                    },
                    {
                        model: AuthorizedModel, as: 'authorized'
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
