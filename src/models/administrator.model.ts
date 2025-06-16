import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class AdministratorModel extends Model{
    public id!: number
    public username!: string
    public password!: string
}

AdministratorModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    }
}, {
    sequelize: database,
    timestamps: false,
    tableName: 'users'
})
