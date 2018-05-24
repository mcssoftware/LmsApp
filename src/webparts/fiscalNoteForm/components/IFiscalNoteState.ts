import { IFiscalNoteForm, IFiscalNoteYear } from "./IFiscalNoteForm";

export interface IFiscalNoteState {
    loading: boolean;
    error: string;
    data: IFiscalNoteForm;
    signedIn?: boolean;
    hasToken?: boolean;
    currentYear: IFiscalNoteYear;
    formValidation: IFormValidation;
}

export interface IFormValidation {
    IsValid: boolean;
    FieldValidations: IFieldValidation[];
}

export interface IFieldValidation {
    FieldName: string;
    IsValid: boolean;
    ErrorMessage: string;
}
