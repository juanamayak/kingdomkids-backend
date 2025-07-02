import { Response, Request } from 'express';
import QRCode from 'qrcode';
import { File } from '../helpers/files';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { SafeString } from 'handlebars';

/* Queries */
import { KidsQuery } from '../queries/kids.query';
import { ParentsQueries } from '../queries/parents.query';
import { Validate } from '../helpers/validate';
import { JsonResponse } from '../enums/json-response';
import { AuthorizedQueries } from '../queries/authorized.query';
import { Mailer } from '../helpers/mailer';

export class RegisterController {
    static file: File = new File();
    static mailer: Mailer = new Mailer();
    static kidsQuery: KidsQuery = new KidsQuery();
    static parentsQueries: ParentsQueries = new ParentsQueries();
    static authorizedQueries: AuthorizedQueries = new AuthorizedQueries();
    static validate: Validate = new Validate();

    public async show(req: Request, res: Response) {
        const registerId = req.params.id;

        const register = await RegisterController.kidsQuery.show(registerId);

        if (!register.ok || !register.register) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado',
            });
        }

        return res.status(200).json({
            ok: true,
            register: register.register,
        });
    }

    public async index(req: Request, res: Response) {

        const kidsResult = await RegisterController.kidsQuery.index();

        if (!kidsResult.ok) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado',
            });
        }

        return res.status(200).json({
            ok: true,
            kids: kidsResult.kids,
        });
    }

    public async confirmation(req: Request, res: Response) {
        const registerId = req.params.id;

        const register = await RegisterController.kidsQuery.show(registerId);

        if (!register.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'No se encontro el registro solicitado.' }],
            });
        }

        const fileName = register.register ? register.register.qr_code : null;
        const qr = await RegisterController.file.download(fileName);

        if (!qr.ok) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'Existen problemas al obtener el Código QR' }],
            });
        }

        return res.status(200).json({
            ok: true,
            register: register.register,
            qr: qr.qr,
        });
    }

    public async finder(req: Request, res: Response) {
        const body = req.body;

        const register = await RegisterController.kidsQuery.find(body.name);

        if (!register.ok || !register.register) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado',
            });
        }

        return res.status(200).json({
            ok: true,
            register: register.register,
        });
    }

    public async getQRCodeImage(req: Request, res: Response) {
        const registerId = req.params.id;

        const register = await RegisterController.kidsQuery.show(registerId);

        if (!register.ok) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado',
            });
        }

        const fileName = register.register ? register.register.qr_code : null;
        const qr = await RegisterController.file.download(fileName);

        if (!qr.ok) {
            return res.status(400).json({
                ok: false,
                message: 'Existen problemas al descargar el archivo QR',
            });
        }

        return res.status(200).json({
            ok: true,
            qr: qr.qr,
        });

    }

    public async register(req: Request, res: Response) {
        let errors = [];
        const body = req.body;
        let parents = (req.body.parents) ? req.body.parents : null;
        let authorizedPersons = (req.body.authorized_person) ? req.body.authorized_person : null;

        // 1. Validar información
        const kidData = {
            uuid: uuidv4(),
            name: body.name,
            lastname: body.lastname,
            birthday: body.birthday,
            age: body.age,
            address: body.address,
            allergy: body.allergy,
            allergy_description: body.allergy_description,
            medical_condition: body.medical_condition,
            medical_condition_description: body.medical_condition_description,
            mdf_member: body.mdf_member,
            another_church: body.another_church,
            another_church_name: body.another_church_name,
            invited: body.invited,
            invite_name: body.invite_name,
            qr_code: '',
            terms_condition: body.terms_condition ? 1 : 0,
        };
        let validateKidInfo = RegisterController.validate.kid(kidData);

        if (validateKidInfo.ok == false) {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: validateKidInfo.errors,
            });
        }

        if (parents && parents.length >= 1) {
            for (const parent of parents) {
                let validateParentInfo = RegisterController.validate.parent(parent);

                if (validateParentInfo.ok == false) {
                    return res.status(JsonResponse.BAD_REQUEST).json({
                        ok: false,
                        errors: validateParentInfo.errors,
                    });
                }
            }
        } else {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: [{ message: 'La información de los padres es obligatorio. Revisa la información e intenta nuevamente.' }],
            });
        }

        // 2. Se realiza el registro del niño
        const kid = await RegisterController.kidsQuery.register(kidData);

        if (!kid.ok) {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                message: [{ message: 'Existen problemas al momento de registrar el niño.' }],
            });
        }

        // 3. Se realizar registro de padres

        for (const parent of parents) {
            const parentData = {
                kid_id: kid.kid.id,
                uuid: uuidv4(),
                full_name: parent.full_name,
                email: parent.email,
                cellphone: parent.cellphone,
                type: parent.type.toUpperCase(),
            };
            const parentResult = await RegisterController.parentsQueries.register(parentData);
            if (!parentResult.ok) {
                return res.status(JsonResponse.BAD_REQUEST).json({
                    ok: false,
                    message: [{ message: 'Existen problemas al momento de registrar a los padres' }],
                });
            }
        }

        for (const authorized of body.authorized_person) {
            if ((authorized.full_name != '' || authorized.cellphone != '' || authorized.relationship != '')) {
                const authorizedData = {
                    kid_id: kid.kid.id,
                    uuid: uuidv4(),
                    full_name: authorized.full_name,
                    cellphone: authorized.cellphone,
                    relationship: authorized.relationship,
                };
                const authRes = await RegisterController.authorizedQueries.register(authorizedData);
                if (!authRes.ok) {
                    return res.status(JsonResponse.BAD_REQUEST).json({
                        ok: false,
                        message: [{ message: 'Existen problemas al momento de registrar a las personas autorizadas' }],
                    });
                }
            }
        }

        const registerId = kid.kid ? kid.kid.id : null;
        QRCode.toDataURL(`/verificacion/${registerId}`, {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg',
            margin: 1,
        }).then(async (url) => {
            const imageUpload = await RegisterController.file.converBase64ToJpg(url);
            if (!imageUpload.ok) {
                return res.status(JsonResponse.BAD_REQUEST).json({
                    ok: false,
                    message: [{ message: 'Existen problemas al guardar el archivo QR. Contacte a soporte.' }],
                });
            }

            const dataUpdate = {
                qr_code: imageUpload.image,
            };

            const updatedKidResult = await RegisterController.kidsQuery.update(registerId, dataUpdate);

            if (!updatedKidResult.ok) {
                return res.status(JsonResponse.BAD_REQUEST).json({
                    ok: false,
                    message: [{ message: 'Existen problemas al actualizar el registro.' }],
                });
            }

            /*for (const parent of parents) {
                const sendEmail = await RegisterController.mailer.send({
                    email: parent.email,
                    subject: 'KINGDOM KIDS 2025 - REGISTRO EXITOSO',
                    template: 'activation',
                    kid: `${kidData.name} ${kidData.lastname}`,
                    qrCode: imageUpload.image,
                });
            }*/

            return res.status(JsonResponse.OK).json({
                ok: true,
                message: 'El registro se realizo con exito.',
                register: kid.kid,
            });
        }).catch(err => {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                message: [{ message: 'Ocurrio un error a la hora realizar el registro. Intente nuevamente.' }],
            });
        });
    }

    public async excelByAge(req: Request, res: Response) {
        const errors = [];

        const age = req.params.age;

        const registers = await RegisterController.kidsQuery.indexByAge(age);

        if (!registers.ok) {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: [{ message: 'Existen problemas al momento de obtener el reporte.' }],
            });
        }

        console.log(registers.registers[0]);

        const registersData = [];

        for (const element of registers.registers) {

            const data = {
                id: element.id,
                name: element.name,
                lastname: element.lastname,
                birthday: element.birthday,
                age: element.age,
                address: element.address,
                allergy_description: element.allergy_description,
                medical_condition_description: element.medical_condition_description,
                mdf_member: element.mdf_member,
                another_church_name: element.another_church_name,
                invite_name: element.invite_name,
                mother_name: element['parents'][0].full_name,
                mother_email: element['parents'][0].email,
                mother_cellphone: element['parents'][0].cellphone,
                father_name: element['parents'][1].full_name,
                father_email: element['parents'][1].email,
                father_cellphone: element['parents'][1].cellphone,
                auth_person_one_name: element['authorized'][0]?.full_name,
                auth_person_one_cellphone: element['authorized'][0]?.cellphone,
                auth_person_one_relationship: element['authorized'][0]?.relationship,
                auth_person_two_name: element['authorized'][0]?.full_name,
                auth_person_two_cellphone: element['authorized'][0]?.cellphone,
                auth_person_two_relationship: element['authorized'][0]?.relationship
            };
            console.log(data);
            registersData.push(data);
        }

        try {
            const buffer = await RegisterController.generateExcel(registersData);
            res.status(200);
            res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);
        } catch (e) {
            return res.status(400).json({
                ok: false,
                errors: [{ message: 'No se puede generar Excel.' }],
            });
        }
    }

    private static async generateExcel(data: any[], type?: string, startDate?: string, endDate?: string) {
        // Prepare workbook
        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet('Registros');

        const columnStyle = {
            font: {
                bold: true,
            },
        };

        worksheet.getRow(1).values = [
            'ID',
            'NOMBRE',
            'APELLIDOS',
            'FECHA DE NACIMIENTO',
            'EDAD',
            'DIRECCIÓN',
            'ALERGIA',
            'CONDICIÓN MÉDICA',
            'MIEMBRO MDF',
            'NOMBRE DE IGLESIA',
            '¿QUIEN LO INVITO?',
            'MAMA',
            'CORREO MAMA',
            'CELULAR MAMA',
            'PAPA',
            'CORREO PAPA',
            'CELULAR PAPA',
            'PERSONA AUTORIZADA 1',
            'PERSONA AUTORIZADA 1 CELULAR',
            'PERSONA AUTORIZADA 1 RELACIÓN',
            'PERSONA AUTORIZADA 2',
            'PERSONA AUTORIZADA 2 CELULAR',
            'PERSONA AUTORIZADA 2 RELACIÓN'
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center' };
        worksheet.autoFilter = 'A1:V1';

        worksheet.columns = [
            { key: 'id', width: 16 },
            { key: 'name', width: 16 },
            { key: 'lastname', width: 22 },
            { key: 'birthday', width: 30 },
            { key: 'age', width: 16 },
            { key: 'address', width: 16 },
            { key: 'allergy_description', width: 16 },
            { key: 'medical_condition_description', width: 16 },
            { key: 'mdf_member', width: 16 },
            { key: 'another_church_name', width: 16 },
            { key: 'invite_name', width: 16 },
            { key: 'mother_name', width: 16 },
            { key: 'mother_email', width: 16 },
            { key: 'mother_cellphone', width: 16 },
            { key: 'father_name', width: 16 },
            { key: 'father_email', width: 16 },
            { key: 'father_cellphone', width: 16 },
            { key: 'auth_person_one_name', width: 16 },
            { key: 'auth_person_one_cellphone', width: 16 },
            { key: 'auth_person_one_relationship', width: 16 },
            { key: 'auth_person_two_name', width: 16 },
            { key: 'auth_person_two_cellphone', width: 16 },
            { key: 'auth_person_two_relationship', width: 16 }
        ];

        worksheet.getColumn('A').alignment = { horizontal: 'center' };
        worksheet.getColumn('B').alignment = { horizontal: 'center' };
        worksheet.getColumn('C').alignment = { horizontal: 'center' };
        worksheet.getColumn('D').alignment = { horizontal: 'center' };
        worksheet.getColumn('E').alignment = { horizontal: 'center' };
        worksheet.getColumn('F').alignment = { horizontal: 'center' };
        worksheet.getColumn('G').alignment = { horizontal: 'center' };
        worksheet.getColumn('H').alignment = { horizontal: 'center' };
        worksheet.getColumn('I').alignment = { horizontal: 'center' };
        worksheet.getColumn('J').alignment = { horizontal: 'center' };
        worksheet.getColumn('K').alignment = { horizontal: 'center' };
        worksheet.getColumn('L').alignment = { horizontal: 'center' };
        worksheet.getColumn('M').alignment = { horizontal: 'center' };
        worksheet.getColumn('N').alignment = { horizontal: 'center' };
        worksheet.getColumn('O').alignment = { horizontal: 'center' };
        worksheet.getColumn('P').alignment = { horizontal: 'center' };
        worksheet.getColumn('Q').alignment = { horizontal: 'center' };
        worksheet.getColumn('R').alignment = { horizontal: 'center' };
        worksheet.getColumn('S').alignment = { horizontal: 'center' };
        worksheet.getColumn('T').alignment = { horizontal: 'center' };
        worksheet.getColumn('U').alignment = { horizontal: 'center' };
        worksheet.getColumn('V').alignment = { horizontal: 'center' };

        // let cell

        const mapped: any[] = data.map(n => ({
            id: n.id,
            name: n.name,
            lastname: n.lastname,
            birthday: n.birthday,
            age: n.age,
            address: n.address,
            allergy_description: n.allergy_description,
            medical_condition_description: n.medical_condition_description,
            mdf_member: n.mdf_member == 1 ? 'Si' : 'No',
            another_church_name: n.another_church_name,
            invite_name: n.invite_name,
            mother_name: n.mother_name,
            mother_email: n.mother_email,
            mother_cellphone: n.mother_cellphone,
            father_name: n.father_name,
            father_email: n.father_email,
            father_cellphone: n.father_cellphone,
            auth_person_one_name: n.auth_person_one_name,
            auth_person_one_cellphone: n.auth_person_one_cellphone,
            auth_person_one_relationship: n.auth_person_one_relationship,
            auth_person_two_name: n.auth_person_two_name,
            auth_person_two_cellphone: n.auth_person_two_cellphone,
            auth_person_two_relationship: n.auth_person_two_relationship
        }));

        worksheet.addRows(mapped);

        return await workbook.xlsx.writeBuffer();

    }
}

