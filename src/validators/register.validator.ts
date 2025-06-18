import { check } from 'express-validator';
import {validateResult} from '../helpers/validate';

export const validateCreate = [
    check('name').exists().notEmpty().withMessage('Ingrese el nombre del niño/a correctamente.'),
    check('lastname').exists().notEmpty().withMessage('Ingrese el apellido del niño/a correctamente.'),
    check('birthday').exists().notEmpty().withMessage('Ingrese la fecha de nacimiento correctamente'),
    check('age').exists().notEmpty().withMessage('Ingrese la edad del niño correctamente.'),
    check('address').exists().notEmpty().withMessage('Ingrese la dirección correctamente.'),
    check('terms_condition').exists().notEmpty().withMessage('Se requiere aceptar los terminos y condiciones para continuar'),
    (req: any, res: any, next: any) => {
        validateResult(req, res, next)
    }
];
