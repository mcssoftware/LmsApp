import { ITasks, IBills, IWorkflowDefinition, ITaskAction } from "mcs-lms-core";
import { HttpClient } from "@microsoft/sp-http";

// tslint:disable-next-line:no-empty-interface
export interface IActionFormProps {
    isLocalEnvironment: boolean;
    task?: ITasks;
    httpClient: HttpClient;
    token: string;
    taskActions?: (actions: ITaskAction[]) => void;
}