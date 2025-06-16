import {Op} from 'sequelize'
import {AdministratorModel} from '../models/administrator.model'

export class AdministratorsQueries {
    public async findAdministradorByUsuario(data: any) {
        try {
            const administrator = await AdministratorModel.findOne({
                where: {
                    username: data.usuario
                }
            })
            return {ok: true, administrator}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }
    }
}
