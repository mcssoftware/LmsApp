// import { serviceHelper } from "./index";
// import {
//     IWorkflowStepActionApi,
//     IActionDefinition,
//     IWorkflowDefinition,
//     IBillWorkflowDefinitionStepAction,
//     IActionDefinitionApi,
// } from "../interfaces";

// export class WorkflowActionService {
//     private _actionDefinitionApi: IActionDefinitionApi;
//     private _workflowDefStepAction: IWorkflowStepActionApi;

//     constructor(private isLocalEnvironment: boolean) {
//         this._actionDefinitionApi = serviceHelper.getActionDefinitionApi(this.isLocalEnvironment);
//         this._workflowDefStepAction = serviceHelper.getWorkflowStepActionApi(this.isLocalEnvironment);
//     }

//     public getActionForWorkflowStep(step: IWorkflowDefinition): Promise<IActionDefinition[]> {
//         return new Promise<IActionDefinition[]>((resolve, reject) => {
//             this._workflowDefStepAction.getWorkflowStepActionIdForStep(step.Id)
//                 .then((stepActionList: IBillWorkflowDefinitionStepAction[]) => {
//                     const stepIds: number[] = stepActionList.map((value) => {
//                         return value.Id;
//                     });
//                     this._actionDefinitionApi.getActions(stepIds).then((value) => {
//                         resolve(value);
//                     }, (err) => { reject(err); });
//                 }, (err) => { reject(err); });
//         });
//     }
// }