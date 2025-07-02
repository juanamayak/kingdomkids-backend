import { KidsModel } from '../models/kids.model';
import {CheckInAndOutModel} from '../models/checkin_and_out.model';
import {ParentsModel} from "../models/parents.model";
import {AuthorizedModel} from "../models/authorized.model";

export default class Relationship {
    static init() {
        KidsModel.hasMany(CheckInAndOutModel, {foreignKey: 'register_id'});

        KidsModel.hasMany(ParentsModel, {foreignKey: 'kid_id', as: 'parents'});
        ParentsModel.belongsTo(KidsModel, {foreignKey: 'kid_id', as: 'parents'});

        KidsModel.hasMany(AuthorizedModel, {foreignKey: 'kid_id', as: 'authorized'});
        AuthorizedModel.belongsTo(KidsModel, {foreignKey: 'kid_id', as: 'authorized'});
    }
}
