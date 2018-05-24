import { IBills } from "mcs-lms-core";

export interface IFiscalImpactAgencyCC {
    Id?: number;
    FiscalImpactId: number;
    AgencyInfoId: number;
    CCContactName: string;
    CCEmailAddr: string;
}

export interface IFiscalImpactAgencyInfo {
    Id?: number;
    FiscalImpactId: number;
    AgencyName: string;
    DirectorName: string;
    DirectorEmail: string;
    AgencyCode: string;
    FiscalImpactAgencyCCs: IFiscalImpactAgencyCC[];
}

export interface IAttachment {
    Id?: number;
    FiscalImpactsId: number;
    FileName: string;
    Extension: string;
    AttachmentId?: number;
}

export interface IFiscalImpactAttachment {
    Id?: number;
    FiscalImpactId: number;
    FileName: string;
    Extension: string;
    AttachmentId?: number;
}

export default interface IFiscalImpactForm {
    Id?: number;
    BillId?: number;
    LSONumber: string;
    BillNumber: string;
    BillDocumentVersion: string;
    PreparedByFirstName: string;
    PreparedByLastName: string;
    PreparedByPhone: string;
    PreparedByTitle: string;
    PreparedByEmail: string;
    PreparedByFax: string;
    PreparedByAccount: string;
    CatchPhrase: string;
    BillSponsor: string;
    BillStatus: string;
    FiscalImpactDueDate?: Date;
    PacketType: string;
    CancelPreviousRequests: string;
    OtherComments: string;
    SendEmail: boolean;
    AnalystEmail: boolean;
    Message: string;
    Modifiedby: string;
    ModifiedDate: Date;
    FiscalImpactAttachments?: IFiscalImpactAttachment[];
    Bill?: IBills;
    FiscalImpactAgencyInfoes?: IFiscalImpactAgencyInfo[];
}