import { KidsModel } from '../models/kids.model';
import {CheckInAndOutModel} from '../models/checkin_and_out.model';

export default class Relationship {
    static init() {
        KidsModel.hasMany(CheckInAndOutModel, {foreignKey: 'register_id'});
    }
}
