import {Model, DataTypes} from 'sequelize';
import {database} from '../config/database';

export class CheckInAndOutModel extends Model {
    public id: any;
    public uuid: any;
    public kid_id: any;
    public checkin_date: any;
    public createdAt: any;
    public updatedAt: any;
}

CheckInAndOutModel.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            comment: "null",
            autoIncrement: true
        },
        uuid: {
            type: DataTypes.STRING,
            allowNull: false
        },
        kid_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        checkin_date: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize: database,
        tableName: 'checkin_register',
        timestamps: true
    }
);

