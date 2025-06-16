import { Model, DataTypes } from 'sequelize'
import { database } from '../config/database'

export class ExampleModel extends Model {
    public id!: number
}

ExampleModel.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    }
}, {
    sequelize: database,
    tableName: 'example'
})

