import moment from 'moment'
import * as bcrypt from 'bcrypt';
import * as validator from 'validator';
import {Request, Response} from 'express'
import {Payload} from '../helpers/payload'

import {AdministratorsQueries} from '../queries/administrators.queries'

export class SessionController {

    static administratorsQueries: AdministratorsQueries = new AdministratorsQueries()
    static payload: Payload = new Payload()

    public async login(req: Request, res: Response) {
        const body = req.body
        const errors = []

        const usuario: string = body.usuario == null ?
            errors.push({message: 'Favor de proporcionar el nombre de usuario.'}) : body.usuario

        const password: string = body.password == null ?
            errors.push({message: 'Favor de proporcionar la contraseña.'}) : body.password

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            });
        }

        const administrator = await SessionController.administratorsQueries.findAdministradorByUsuario({usuario});

        const adminPass = administrator.administrator ? administrator.administrator.password : '';
        if (!administrator.ok) {
            errors.push({message: 'Existen problemas al momento de verificar si el administrador esta dado de alta.'})
        } else if (administrator.administrator === null) {
            errors.push({message: 'El email proporcionado no se encuentra dado de alta en el sistema.'})
        } else if (!bcrypt.compareSync(password, adminPass)) {
            errors.push({message: 'Las credenciales no coinciden, favor de proporcionarlas de nuevo.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }

        const result = await SessionController.payload.createToken({
            user_type: 'administrador',
            administrator_id: administrator.administrator ? administrator.administrator.id.toString() : false,
        })

        if (result && !result.ok) {
            errors.push({message: 'Existen problemas al momento de crear el token de autenticación.'})
        }

        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                errors
            })
        }


        return res.status(200).json({
            ok: true,
            token: result ? result.token : false,
            identity: administrator.administrator
        })
    }


}
