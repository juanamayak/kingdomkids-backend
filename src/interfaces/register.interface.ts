
// table: register
export interface registerInterface {
   id:any;
   kid_name:string;
   kid_birthday:string;
   kid_age:string;
   is_kid_allergy:number;
   kid_allergy_description:string;
   father_name:string;
   father_cellphone:string;
   mother_name:string;
   mother_cellphone:string;
   phone:string;
   address:string;
   email:string;
   authorized_person:string;
   is_member:number;
   invited_by_mdf_member:number;
   who_invites_name?:string;
   qr_code:string;
   createdAt?:Date;
   updatedAt?:Date;
}
