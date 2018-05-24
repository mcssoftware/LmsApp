import { ITasks, IWorkflowDefinition } from "mcs-lms-core";

export interface IBillTrackingState {
    Task: ITasks;
    Token: string;
    commentEnabled: boolean;
    CurrentStep: IWorkflowDefinition;
    loading: boolean;
    error: string;
    comment: string;
    selectedDropdownOption: string;
}