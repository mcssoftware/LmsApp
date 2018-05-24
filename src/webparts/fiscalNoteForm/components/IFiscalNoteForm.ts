import { IBills } from "mcs-lms-core";

export interface IAppropriationsAgenciesFund {
    Id: number;
    AppropriationsFund: string;
    AppropriationsFundDescription: string;
    AppropriationsAmount: number;
    AppropriationsEffImm: boolean;
    FiscalNoteId: number;
    AppropriationsAgenciesId: number;
}

export interface IAppropriationsAgenciesSery {
    Id: number;
    AppropriationSeries: string;
    AppropriationsSeriesName: string;
    AppropriationSeriesY1: number;
    AppropriationSeriesY2: number;
    AppropriationSeriesY3: number;
    FiscalNoteId: number;
    AppropriationsAgenciesId: number;
}

export interface IAppropriationsAgency {
    Id: number;
    AppropriationsAgency1: string;
    AppropriationsAgencyName: string;
    AppropriationsUnit: string;
    FiscalNoteId: number;
    AppropriationsAgenciesFunds?: IAppropriationsAgenciesFund[];
    AppropriationsAgenciesSeries?: IAppropriationsAgenciesSery[];
}

export interface IFiscalNoteYear {
    Id: number;
    CurrentYear: number;
    RevExpYearDisplay1: number;
    RevExpYearDisplay2: number;
    RevExpYearDisplay3: number;
    SeriesYearDisplay1: number;
    SeriesYearDisplay2: number;
    SeriesYearDisplay3: number;
    SeriesYearDisplay4: number;
    FiscalNotes: IFiscalNoteForm[];
}

export interface IFiscalNoteAgencyContact {
    Id: number;
    Agency: string;
    AgencyName: string;
    ContactName: string;
    ContactPhone: string;
    FiscalNoteId: number;
}

export interface INonAdminAnticipatedExpenditure {
    Id: number;
    AnticipatedExpenditureY1: number;
    AnticipatedExpenditureY2: number;
    AnticipatedExpenditureY3: number;
    AnticipatedExpenditureType: string;
    AnticipatedExpenditureFund: string;
    AnticipatedExpenditureFundDescription: string;
    FiscalNoteId: number;
}

export interface INonAdminAnticipatedRevenue {
    Id: number;
    AnticipatedRevenueY1: number;
    AnticipatedRevenueY2: number;
    AnticipatedRevenueY3: number;
    AnticipatedRevenueType: string;
    AnticipatedRevenueFund: string;
    AnticipatedRevenueFundDescription: string;
    FiscalNoteId: number;
}

export interface IAdminImpactAgency {
    Id: number;
    FiscalNoteId: number;
    AgencyName?: string;
}

export interface IFiscalNoteForm {
    Id: number;
    BillId?: number;
    LSONumber: string;
    CatchTitle: string;
    BillNumber: string;
    BillDocumentVersion: string;
    NonAdministrativeImpact: boolean;
    Sponsor: string;
    AdminstrativeImpact: boolean;
    ContainsAppropriation: boolean;
    AnticipatedIncreasePersonnel: boolean;
    FTPos: number;
    PTPos: number;
    AWECPos: number;
    RegenerateFiscalNote: boolean;
    Message: string;
    PreparedByFirstName: string;
    PreparedByLastName: string;
    PreparedByTitle: string;
    PreparedByPhone: string;
    PreparedByEmail: string;
    PreparedByFax: string;
    Determinability: boolean;
    DeterminabilityReason: string;
    FiscalNoteYearId: number;
    ModifiedBy: string;
    ModifiedDate: Date;
    AdministrativeImpactAgencies?: IAdminImpactAgency[];
    AppropriationsAgencies?: IAppropriationsAgency[];
    Bill?: IBills;
    FiscalNoteAgencyContacts?: IFiscalNoteAgencyContact[];
    NonAdminAnticipatedExpenditures?: INonAdminAnticipatedExpenditure[];
    NonAdminAnticipatedRevenues?: INonAdminAnticipatedRevenue[];
}