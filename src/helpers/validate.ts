import validator from 'validator';
import moment from 'moment'

export class Validate {

    public kid(data: any) {
        let errors = [];

        let name: string = data.name == null || validator.isEmpty(data.name) ?
            errors.push({ message: 'Favor de proporcionar el nombre.' }) : data.name;

        let lastname: string = data.lastname == null || validator.isEmpty(data.lastname) ?
            errors.push({ message: 'Favor de proporcionar el apellido.' }) : data.lastname;

        let birthday: string = data.birthday == null || validator.isEmpty(data.birthday) ?
            errors.push({ message: 'Favor de proporcionar la fecha de nacimiento.' }) : data.birthday;

        let age: number = data.age == null ?
            errors.push({ message: 'Favor de proporcionar la edad.' }) : data.age;

        let address: string = data.address == null || validator.isEmpty(data.address) ?
            errors.push({ message: 'Favor de proporcionar la dirección.' }) : data.address;

        // Validar si hay alergias y su descripción
        if (data.allergy && (data.allergy_description == null || validator.isEmpty(data.allergy_description))) {
            errors.push({ message: 'Favor de proporcionar la descripción de la alergia.' });
        }

        // Validar si hay condición médica y su descripción
        if (data.medical_condition && (data.medical_condition_description == null || validator.isEmpty(data.medical_condition_description))) {
            errors.push({ message: 'Favor de proporcionar la descripción de la condición médica.' });
        }

        // Validar si pertenece a otra iglesia y el nombre
        if (data.another_church && (data.another_church_name == null || validator.isEmpty(data.another_church_name))) {
            errors.push({ message: 'Favor de proporcionar el nombre de la otra iglesia.' });
        }

        // Validar si fue invitado y el nombre del invitador
        if (data.invited && (data.invite_name == null || validator.isEmpty(data.invite_name))) {
            errors.push({ message: 'Favor de proporcionar el nombre de quien invitó.' });
        }

        // Validar términos y condiciones
        if (data.terms_condition !== 1) {
            errors.push({ message: 'Debe aceptar los términos y condiciones.' });
        }

        // Validaciones de formato
        if (birthday && !moment(birthday, 'YYYY-MM-DD', true).isValid()) {
            errors.push({ message: 'La fecha de nacimiento debe respetar el formato: YYYY-MM-DD.' });
        }

        if (age && !validator.isNumeric(String(age))) {
            errors.push({ message: 'La edad debe ser un valor numérico.' });
        }

        if (errors.length > 0) {
            return { ok: false, errors };
        } else {
            return { ok: true };
        }
    }


    public authorized(data) {
        let errors = []

        let full_name: string = data.full_name == null || validator.isEmpty(data.full_name) ?
            errors.push({ message: 'Favor de proporcionar el nombre correctamente' }) : data.full_name

        let cellphone: string = data.cellphone == null || validator.isEmpty(data.cellphone) ?
            errors.push({ message: 'Favor de proporcionar el número celular correctamente' }) : data.cellphone

        let relationship: string = data.relationship == null || validator.isEmpty(data.relationship) ?
            errors.push({ message: 'Favor de proporcionar la relación que existe' }) : data.relationship

        if (errors.length > 0) {
            return { ok: false, errors }
        } else {
            return { ok: true }
        }

    }

    public parent(data) {
        let errors = []

        let full_name: string = data.full_name == null || validator.isEmpty(data.full_name) ?
            errors.push({ message: 'Favor de proporcionar el nombre correctamente' }) : data.full_name

        let cellphone: string = data.cellphone == null || validator.isEmpty(data.cellphone) ?
            errors.push({ message: 'Favor de proporcionar el número celular correctamente' }) : data.cellphone

        let type: string = data.type == null || validator.isEmpty(data.type) ?
            errors.push({ message: 'Favor de proporcionar tipo de usuario' }) : data.type

        if (errors.length > 0) {
            return { ok: false, errors }
        } else {
            return { ok: true }
        }

    }
}

