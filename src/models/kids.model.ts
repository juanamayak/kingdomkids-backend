import { Model, DataTypes } from 'sequelize';
import { database } from '../config/database';

export class KidsModel extends Model {
    public id: any;
    public name: string;
    public lastname: string;
    public birthday: string;
    public age: string;
    public address: string;
    public allergy: string;
    public allergy_description: string;
    public medical_condition: string;
    public medical_condition_description: string;
    public mdf_member: string;
    public another_church: string;
    public another_church_name: string;
    public invited: string;
    public invite_name: string;
    public qr_code: string;
}

KidsModel.init({
      id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          comment: 'null',
          autoIncrement: true,
      },
      kid_name: {
          type: DataTypes.STRING(150),
          allowNull: false,
      },
      kid_birthday: {
          type: DataTypes.STRING(150),
          allowNull: false,
      },
      kid_age: {
          type: DataTypes.STRING(100),
          allowNull: false,
      },
      studying_level: {
          type: DataTypes.STRING(100),
          allowNull: false,
      },

      father_name: {
          type: DataTypes.STRING(150),
          allowNull: false,
      },
      father_cellphone: {
          type: DataTypes.STRING(15),
          allowNull: false,
      },
      mother_name: {
          type: DataTypes.STRING(150),
          allowNull: false,
      },
      mother_cellphone: {
          type: DataTypes.STRING(15),
          allowNull: false,
      },
      address: {
          type: DataTypes.STRING(255),
          allowNull: false,
      },
      phone: {
          type: DataTypes.STRING(15),
          allowNull: false,
      },
      ap_name_one: {
          type: DataTypes.STRING(150),
          allowNull: true,
      },
      ap_relationship_one: {
          type: DataTypes.STRING(150),
          allowNull: true,
      },
      ap_cellphone_one: {
          type: DataTypes.STRING(15),
          allowNull: true,
      },
      ap_name_two: {
          type: DataTypes.STRING(150),
          allowNull: true,
      },
      ap_relationship_two: {
          type: DataTypes.STRING(150),
          allowNull: true,
      },
      ap_cellphone_two: {
          type: DataTypes.STRING(15),
          allowNull: true,
      },
      kid_allergy: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },
      allergy_description: {
          type: DataTypes.STRING(255),
          allowNull: false,
      },
      health_condition: {
          type: DataTypes.STRING(255),
          allowNull: true,
      },
      mdf_member: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },
      church: {
          type: DataTypes.STRING(255),
          allowNull: true,
      },
      invited_mdf_member: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },
      inviters_name: {
          type: DataTypes.STRING(150),
          allowNull: false,
      },
      qr_code: {
          type: DataTypes.STRING(150),
          allowNull: true,
      },
      terms: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },
  }, {
      sequelize: database,
      tableName: 'register',
      timestamps: true,
  },
);

