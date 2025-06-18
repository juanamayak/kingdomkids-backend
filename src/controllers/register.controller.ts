import {Response, Request} from 'express'
import QRCode from 'qrcode';
import {File} from '../helpers/files';
import * as ExcelJS from 'exceljs'
import { v4 as uuidv4 } from 'uuid';

/* Queries */
import {KidsQuery} from '../queries/kids.query';

export class RegisterController {
    static file: File = new File()
    static kidsQuery: KidsQuery = new KidsQuery();

    public async show(req: Request, res: Response) {
        const registerId = req.params.id;

        const register = await RegisterController.kidsQuery.show(registerId);

        if (!register.ok || !register.register) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado'
            })
        }

        return res.status(200).json({
            ok: true,
            register: register.register,
        });
    }

    public async index(req: Request, res: Response) {

        const registers = await RegisterController.kidsQuery.index();

        if (!registers.ok) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado'
            })
        }

        return res.status(200).json({
            ok: true,
            registers: registers.registers,
        });
    }

    public async confirmation(req: Request, res: Response) {
        const registerId = req.params.id;

        const register = await RegisterController.kidsQuery.show(registerId);

        if (!register.ok) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado'
            })
        }

        const fileName = register.register ? register.register.qr_code : null;
        const qr = await RegisterController.file.download(fileName);

        if (!qr.ok) {
            return res.status(400).json({
                ok: false,
                message: 'Existen problemas al descargar el archivo QR'
            })
        }

        return res.status(200).json({
            ok: true,
            register: register.register,
            qr: qr.qr
        });
    }

    public async getQRCodeImage(req: Request, res: Response) {
        const registerId = req.params.id;

        const register = await RegisterController.kidsQuery.show(registerId);

        if (!register.ok) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontro el registro solicitado'
            })
        }

        const fileName = register.register ? register.register.qr_code : null;
        const qr = await RegisterController.file.download(fileName);

        if (!qr.ok) {
            return res.status(400).json({
                ok: false,
                message: 'Existen problemas al descargar el archivo QR'
            })
        }

        return res.status(200).json({
            ok: true,
            qr: qr.qr
        });

    }

    public async register(req: Request, res: Response) {
        const body = req.body;
        const data = {
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
            terms_condition: body.terms_condition ? 1 : 0
        };

        const kid = await RegisterController.kidsQuery.register(data);

        if (!kid.ok) {
            return res.status(400).json({
                ok: false,
                message: 'Ocurrio un error a la hora realizar el registro'
            })
        }

        const registerId = kid.kid ? kid.kid.id : null;
        QRCode.toDataURL(`/verificacion/${registerId}`, {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg',
            margin: 1
        }).then(async (url) => {
            const imageUpload = await RegisterController.file.converBase64ToJpg(url);
            if (!imageUpload.ok) {
                return res.status(400).json({
                    ok: false,
                    message: 'Existen problemas al guardar el archivo QR. Contacte a soporte.',
                })
            }

            const dataUpdate = {
                qr_code: imageUpload.image
            }

            const updatedRegister = await RegisterController.kidsQuery.update(registerId, dataUpdate);

            if (!updatedRegister.ok) {
                return res.status(400).json({
                    ok: false,
                    message: 'Existen problemas al actualizar el registro.',
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'El registro se realizo con exito.',
                register: kid.kid,
            });
        }).catch(err => {
            console.log(err);
            return res.status(400).json({
                ok: false,
                message: 'Ocurrio un error a la hora realizar el registro. Intente nuevamente :)'
            })
        });
    }

    /*public async excelByAge(req: Request, res: Response) {
        const errors = [];

        const age = req.params.age;

        const registers = await RegisterController.kidsQuery.indexByAge(age)

        if (!registers.ok) {
            return res.status(JsonResponse.BAD_REQUEST).json({
                ok: false,
                errors: [{message: 'Existen problemas al momento de obtener el reporte.'}]
            })
        }

        const registersData = []

        // @ts-ignore
        for (const element of registers.registers) {
            const data = {
                id: element.id,
                kid_name: element.kid_name,
                kid_birthday: element.kid_birthday,
                kid_age: element.kid_age,
                father_name: element.father_name,
                father_cellphone: element.father_cellphone,
                mother_name: element.mother_name,
                mother_cellphone: element.mother_cellphone,
                ap_name_one: element.ap_name_one,
                ap_relationship_one: element.ap_relationship_one,
                ap_cellphone_one: element.ap_cellphone_one,
                ap_name_two: element.ap_name_two,
                ap_relationship_two: element.ap_relationship_two,
                ap_cellphone_two: element.ap_cellphone_two,
                kid_allergy: element.kid_allergy,
                allergy_description: element.allergy_description,
                health_condition: element.health_condition,
                address: element.address,
                phone: element.phone,
                mdf_member: element.mdf_member === 1 ? 'Si' : 'No',
                church: element.church,
                invited_mdf_member: element.invited_mdf_member === 1 ? 'Si' : 'No',
                inviters_name: element.inviters_name
            }
            registersData.push(data)
        }

        try {
            const buffer = await RegisterController.generateExcel(registersData)
            res.status(200)
            res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            return res.send(buffer);
        } catch (e) {
            return res.status(400).json({
                ok: false,
                errors: [{message: 'No se puede generar Excel.'}]
            })
        }
    }*/

    private static async generateExcel(data: any[], type?: string, startDate?: string, endDate?: string) {
        // Prepare workbook
        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet('Registros');

        const columnStyle = {
            font: {
                bold: true
            }
        }

        worksheet.getRow(1).values = ['ID', 'NOMBRE', 'FECHA DE NACIMIENTO', 'EDAD', 'PAPA', 'TEL. PAPA', 'MAMA', 'TEL. MAMA',
            'PERSONA AUTORIZADA 1', 'PARENTESCO PA 1', 'TEL PA 1', 'PERSONA AUTORIZADA 2', 'PARENTESCO PA 2', 'TEL PA 2', 'ALERGIA',
        'CONDICIÓN DE SALUD', 'DIRECCIÓN', 'TELEFONO', '¿MIEMBRO DE MDF?', 'IGLESIA', '¿LO INVITO MIEMBRO MDF?', 'NOMBRE QUIEN INVITO'];
        worksheet.getRow(1).font = {bold: true}
        worksheet.getRow(1).alignment = {horizontal: 'center'}
        worksheet.autoFilter = 'A1:V1';

        worksheet.columns = [
            {key: 'id', width: 16},
            {key: 'kid_name', width: 16},
            {key: 'kid_birthday', width: 22},
            {key: 'kid_age', width: 30},
            {key: 'father_name', width: 16},
            {key: 'father_cellphone', width: 20},
            {key: 'mother_name', width: 16},
            {key: 'mother_cellphone', width: 16},
            {key: 'ap_name_one', width: 16},
            {key: 'ap_relationship_one', width: 16},
            {key: 'ap_cellphone_one', width: 16},
            {key: 'ap_name_two', width: 16},
            {key: 'ap_relationship_two', width: 16},
            {key: 'ap_cellphone_two', width: 16},
            {key: 'allergy_description', width: 16},
            {key: 'health_condition', width: 16},
            {key: 'address', width: 16},
            {key: 'phone', width: 16},
            {key: 'mdf_member', width: 16},
            {key: 'church', width: 16},
            {key: 'invited_mdf_member', width: 16},
            {key: 'inviters_name', width: 16},
        ]

        worksheet.getColumn('A').alignment = {horizontal: 'center'}
        worksheet.getColumn('B').alignment = {horizontal: 'center'}
        worksheet.getColumn('C').alignment = {horizontal: 'center'}
        worksheet.getColumn('D').alignment = {horizontal: 'center'}
        worksheet.getColumn('E').alignment = {horizontal: 'center'}
        worksheet.getColumn('F').alignment = {horizontal: 'center'}
        worksheet.getColumn('G').alignment = {horizontal: 'center'}
        worksheet.getColumn('H').alignment = {horizontal: 'center'}
        worksheet.getColumn('I').alignment = {horizontal: 'center'}
        worksheet.getColumn('J').alignment = {horizontal: 'center'}
        worksheet.getColumn('K').alignment = {horizontal: 'center'}
        worksheet.getColumn('L').alignment = {horizontal: 'center'}
        worksheet.getColumn('M').alignment = {horizontal: 'center'}
        worksheet.getColumn('N').alignment = {horizontal: 'center'}
        worksheet.getColumn('O').alignment = {horizontal: 'center'}
        worksheet.getColumn('P').alignment = {horizontal: 'center'}
        worksheet.getColumn('Q').alignment = {horizontal: 'center'}
        worksheet.getColumn('R').alignment = {horizontal: 'center'}
        worksheet.getColumn('S').alignment = {horizontal: 'center'}
        worksheet.getColumn('T').alignment = {horizontal: 'center'}
        worksheet.getColumn('U').alignment = {horizontal: 'center'}
        worksheet.getColumn('V').alignment = {horizontal: 'center'}

        // let cell

        const mapped: any[] = data.map(n => ({
            id: n.id,
            kid_name: n.kid_name,
            kid_birthday: n.kid_birthday,
            kid_age: n.kid_age,
            father_name: n.father_name,
            father_cellphone: n.father_cellphone,
            mother_name: n.mother_name,
            mother_cellphone: n.mother_cellphone,
            ap_name_one: n.ap_name_one,
            ap_relationship_one: n.ap_relationship_one,
            ap_cellphone_one: n.ap_cellphone_one,
            ap_name_two: n.ap_name_two,
            ap_relationship_two: n.ap_relationship_two,
            ap_cellphone_two: n.ap_cellphone_two,
            allergy_description: n.allergy_description,
            health_condition: n.health_condition,
            address: n.address,
            phone: n.phone,
            mdf_member: n.mdf_member,
            church: n.church,
            invited_mdf_member: n.invited_mdf_member,
            inviters_name: n.inviters_name
        }))

        worksheet.addRows(mapped);

        return await workbook.xlsx.writeBuffer()

    }
}

