import {Response, Request} from 'express'
import {CheckinAndOutQuery} from "../queries/checkin_and_out.query";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';

export class CheckinAndOutController {

    static checkinAndOutQuery: CheckinAndOutQuery = new CheckinAndOutQuery();

    public async indexToday(req: Request, res: Response) {

        const result = await CheckinAndOutController.checkinAndOutQuery.index();

        if (!result.ok) {
            return res.status(500).json({
                ok: false,
                message: 'Error al obtener check-ins del día'
            });
        }

        return res.status(200).json({
            ok: true,
            checkins: result.checkins || [],
        });
    }

    public async showByRegister(req: Request, res: Response) {
        const registerId = req.params.id;

        const checkin = await CheckinAndOutController.checkinAndOutQuery.showByRegister(registerId);

        return res.status(200).json({
            ok: true,
            checkin: checkin.checkin,
        });
    }

    public async indexByRegister(req: Request, res: Response) {
        const registerId = req.params.register_id;

        const checkins = await CheckinAndOutController.checkinAndOutQuery.indexByRegister(registerId);

        return res.status(200).json({
            ok: true,
            checkins: checkins.checkins,
        });
    }

    public async checkin(req: Request, res: Response) {

        const body = req.body;

        const data = {
            uuid: uuidv4(),
            kid_id: body.register_id,
            checkin_date: moment().format('YYYY-MM-DD HH:mm:ss')
        }

        console.log(data);

        const checking = await CheckinAndOutController.checkinAndOutQuery.checkin(data);

        if (!checking.ok) {
            return res.status(400).json({
                ok: false,
                message: 'Ocurrio un error a la hora realizar el registro de entrada. Intente nuevamente'
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'El registro se realizo con exito.'
        });
    }


    public async checkout(req: Request, res: Response) {
        const status = req.body.status;
        const checkinId = req.params.id;

        const checkin = await CheckinAndOutController.checkinAndOutQuery.show(checkinId);

        if (!checkin.ok) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro la cuenta que se desea actualizar'
            })
        }

        const data = {
            status,
            checkin_date: checkin.checkin ? moment(checkin.checkin.checkin_date).format('YYYY-MM-DD HH:mm:ss') : null,
            checkout_date: moment().format('YYYY-MM-DD HH:mm:ss')

        }

        const checkout = await CheckinAndOutController.checkinAndOutQuery.checkout(checkinId, data);

        if (!checkout.ok) {
            return res.status(400).json({
                ok: false,
                message: 'Ocurrio un error a la hora de actualizar la salida'
            })
        }

        return res.status(200).json({
            ok: true,
            message: 'Se registro la salida correctamente'
        })
    }
}

