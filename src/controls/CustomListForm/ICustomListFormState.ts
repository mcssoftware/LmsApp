import { IFieldSchema } from "./RenderListData";

export interface ICustomListFormState {
    hideDialog: boolean;
    isLoadingSchema: boolean;
    isLoadingData: boolean;
    errors: string[];
    notifications: string[];
    fieldsSchema?: IFieldSchema[];
    data: any;
    originalData: any;
    fieldErrors: { [fieldName: string]: string };
    isSaving: boolean;
}