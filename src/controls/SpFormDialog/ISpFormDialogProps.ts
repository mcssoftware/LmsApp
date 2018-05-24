import { ControlMode } from "../CustomListForm/ControlMode";

export interface ISpFormDialogProps {
    listId: string;
    webUrl: string;
    formTitle: string;
    formType: ControlMode;
    itemId?: number;
    defaultValues?: { [fieldName: string]: string };
}