import { IFiscalDirectiveForm } from "./IFiscalDirectiveForm";

export interface IFiscalNoteDirectiveState {
    loading: boolean;
    error: string;
    data: IFiscalDirectiveForm;
    signedIn?: boolean;
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
