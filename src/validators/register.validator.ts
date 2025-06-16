import { check } from 'express-validator';
import {validateResult} from '../helpers/validate';

export const validateCreate = [
    check('name').exists().notEmpty().withMessage('Ingrese el nombre del niño/a correctamente.'),
    check('lastname').exists().notEmpty().withMessage('Ingrese el apellido del niño/a correctamente.'),
    check('birthday').exists().notEmpty().withMessage('Ingrese la fecha de nacimiento correctamente'),
    check('age').exists().notEmpty().withMessage('Ingrese la edad del niño correctamente.'),
    check('address').exists().notEmpty().withMessage('Ingrese la dirección correctamente.'),
    check('allergy_description').exists().withMessage('Ingrese la descripción de la alergia'),
    check('medical_condition_description').exists().notEmpty().withMessage('Ingrese so existe alguna condición médica especial.'),
    check('another_church_name').exists().notEmpty().withMessage('Ingrese si lo invito alguien de Mundo de Fe Playa'),
    check('invite_name').exists().notEmpty().withMessage('Ingrese si lo invito alguien de Mundo de Fe Playa'),
    (req: any, res: any, next: any) => {
        validateResult(req, res, next)
    }
];
