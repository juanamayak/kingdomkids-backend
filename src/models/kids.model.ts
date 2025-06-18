import { Model, DataTypes } from 'sequelize';
import { database } from '../config/database';

export class KidsModel extends Model {
    public id!: number;
    public uuid!: string;
    public name!: string;
    public lastname!: string;
    public birthday!: string;
    public age!: string;
    public address!: string;
    public allergy!: string;
    public allergy_description!: string;
    public medical_condition!: string;
    public medical_condition_description!: string;
    public mdf_member!: string;
    public another_church!: string;
    public another_church_name!: string;
    public invited!: string;
    public invite_name!: string;
    public qr_code!: string;
    public terms_condition!: string;
}

KidsModel.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    uuid: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    lastname: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    birthday: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    age: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    allergy: {
        type: DataTypes.STRING(50),  // Podría ser un ENUM o un INTEGER si manejas 0/1
        allowNull: false,
    },
    allergy_description: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    medical_condition: {
        type: DataTypes.STRING(50),  // Igual, depende cómo lo manejes (boolean, enum, etc.)
        allowNull: false,
    },
    medical_condition_description: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    mdf_member: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    another_church: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    another_church_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    invited: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    invite_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    qr_code: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    terms_condition: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
}, {
    sequelize: database,
    tableName: 'kids',
    timestamps: true,
});

