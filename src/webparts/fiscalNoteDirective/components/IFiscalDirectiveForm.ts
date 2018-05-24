import { IBills } from "mcs-lms-core";

export interface IFiscalDirectiveAgency {
    Id?: number;
    FiscalDirectiveId: number;
    AgencyCode: string;
    AgencyName?: string;
}

export interface IFiscalDirectiveForm {
    Id?: number;
    BillId?: number;
    DocumentDisposition: string;
    BillDrafted: string;
    ContainAppropriation: boolean;
    ContainAppropriationSpecified: boolean;
    AuthorizeAdditionalPeronnel: string;
    ChangeRevenueStreams: string;
    IncreaseDecreaseRevenue: string;
    IncreaseDecreaseExpenditures: string;
    IncDecUnrelExpenditures: string;
    AffectCaseloadsfortheCourts: boolean;
    Date: Date;
    LSONumber: string;
    CatchTitle: string;
    BillDocumentVersion: string;
    PreparedByFirstName: string;
    PreparedByLastName: string;
    PreparedByTitle: string;
    PreparedByPhone: string;
    PreparedByEmail: string;
    IdenticalLSO: string;
    SimilarLSO: string;
    PreviousLSO: string;
    PreviousYear: string;
    SeeDrafter?: boolean;
    Sponsor: string;
    Drafter: string;
    BillNumber: string;
    AgencyCount?: number;
    PreparedByFax: string;
    AdditionalInformation: string;
    SendDisposition: string;
    OtherCommentsFiscalNote: string;
    ModifiedBy: string;
    ModifiedDate?: Date|number;
    FiscalDirectiveAgencies?: IFiscalDirectiveAgency[];
}