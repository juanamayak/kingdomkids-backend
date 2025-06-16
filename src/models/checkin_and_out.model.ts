import {Model, DataTypes} from 'sequelize';
import {database} from '../config/database';

export class CheckInAndOutModel extends Model {
    public id: any;
    public register_id: any;
    public checkin_date: any;
    public checkout_date: any;
    public status: any;
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
        register_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        checkin_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        checkout_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
    }, {
        sequelize: database,
        tableName: 'checkin_and_out',
        timestamps: false
    }
);

