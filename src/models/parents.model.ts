import { Model, DataTypes } from 'sequelize';
import { database } from '../config/database';

export class ParentsModel extends Model {
    public id!: number;
    public kid_id: number;
    public uuid!: string;
    public full_name!: string;
    public cellphone!: string;
    public type!: string;
}

ParentsModel.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    kid_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    uuid: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    cellphone: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    }
}, {
    sequelize: database,
    tableName: 'parents',
    timestamps: true,
});

