import { ITasks, IWorkflowDefinition } from "mcs-lms-core";
import { IPersonaProps } from "office-ui-fabric-react";

export interface IAssignFiscalAnalystState {
    selectedDropdownOption: string;
    selectedFiscalAnalyst: IPersonaProps[];
    fiscalAnalystAssigned: boolean;
    showSpinner: boolean;
}