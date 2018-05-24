import { ControlMode } from "./ControlMode";

export interface ICustomListFormProps {
    listId: string;
    webUrl: string;
    formTitle: string;
    formType: ControlMode;
    itemId?: number;
    showUnsupportedFields: boolean;
    defaultValues?: { [fieldName: string]: string };
    onSubmitSucceeded?(id: number): void;
    onSubmitFailed?(fieldErrors: any): void;
    onCancel?(): void;
}