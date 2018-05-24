import { ITasks, IWorkflowDefinition } from "mcs-lms-core";
import { IDropdownOption } from "office-ui-fabric-react";

export interface IActionFormState {
    Task: ITasks;
    commentEnabled: boolean;
    loading: boolean;
    error: string;
    singleActionTypeText: string;
    items: any[];
    selectionDetails: any;
    tableEmptyMessage: string;
    SelectedData: IFormSelectedData;
}

export interface IFormSelectedData {
    SelectedDocument: string;
    SelectedAction: number;
    SelectedVote: number;
    Message: string;
}
