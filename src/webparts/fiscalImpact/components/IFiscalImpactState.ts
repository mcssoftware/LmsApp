import IFiscalImpactForm from "./IFiscalImpactForm";

export interface IFiscalImpactState {
    loading: boolean;
    error: string;
    data: IFiscalImpactForm;
    signedIn?: boolean;
    hasToken?: boolean;
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
