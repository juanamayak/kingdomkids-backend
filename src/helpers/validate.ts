import {validationResult} from 'express-validator';


export const validateResult = (req: any, res: any, next: any) => {
    try {
        validationResult(req).throw();
        return next();
    } catch (e: any) {
        res.status(403);
        res.send({errors: e.array()})
    }
}

