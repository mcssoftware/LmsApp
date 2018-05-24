import { IWorkflowDefinition, ITasks } from "mcs-lms-core";

export interface ILmsTaskState {
    task: ITasks;
    commentEnabled: boolean;
    currentStep: IWorkflowDefinition;
    nextSteps: IWorkflowDefinition[];
    showNextSteps: boolean;
    loading: boolean;
    error: string;
    comment: string;
    signedIn: boolean;
    hasToken?: boolean;
    spinnerMessage?: string;
}