// import { ILmsConfigurationApi } from "../interfaces/ILmsConfigurationApi";
// import { MockLmsConfigurationApi } from "../api/Mock/MockLmsConfigurationApi";
// import { LmsConfigurationApi } from "../api/Lists/LmsConfigurationApi";
// import { IBillDraftRequest, ISequenceNumbers } from "../interfaces/ListDefinitions";
// import { IListApi } from "../interfaces/IListApi";
// import { MockBillDraftApi } from "../api/Mock/MockBillDraftApi";
// import { BillDraftApi } from "../api/Lists/BillDraftApi";
// import { IBillApi } from "../interfaces/IBillApi";
// import { MockBillApi } from "../api/Mock/MockBillApi";
// import { BillApi } from "../api/Lists/BillApi";
// import { ILmsTaskApi } from "../interfaces/ILmsTaskApi";
// import { MockLmsTaskApi } from "../api/Mock/MockLmsTaskApi";
// import { LmsTaskApi } from "../api/Lists/LmsTaskApi";
// import { IWorkflowDefinitionApi } from "../interfaces/IWorkflowDefinitionApi";
// import { WorkflowDefinitionApi } from "../api/Lists/WorkflowDefinitionApi";
// import { MockWorkflowDefinitionApi } from "../api/Mock/MockWorkflowDefinitionApi";
// import { MockSequenceNumbersApi } from "../api/Mock/MockSequenceNumbersApi";
// import { SequenceNumbersApi } from "../api/Lists/SequenceNumbersApi";
// import { MockElementsAffectedApi } from "../api/Mock/MockElementsAffectedApi";
// import { IElementsAffectedApi } from "../interfaces/IElementsAffectedApi";
// import { ElementsAffectedApi } from "../api/Lists/ElementsAffectedApi";
// import {
//     IActionDefinitionApi,
//     IWorkflowStepActionApi,
//     IAmendmentApi,
//     IBillDigestApi,
//     ITaskAction,
//     IRollCall,
//     IBillState,
//     ISessionLaws,
//     ISessionLawsApi,
// } from "../interfaces";
// import { ActionDefinitionApi } from "../api/Lists/ActionDefinitionApi";
// import { MockActionDefinitionApi } from "../api/Mock/MockActionDefinitionApi";
// import { WorkflowStepActionApi } from "../api/Lists/WorkflowStepActionApi";
// import { MockWorkflowStepActionApi } from "../api/Mock/MockWorkflowStepActionApi";
// import { MockAmendmentApi } from "../api/Mock/MockAmendmentApi";
// import { AmendmentApi } from "../api/Lists/AmendmentApi";
// import { BillDigestApi } from "../api/Lists/BillDigestApi";
// import { MockBillDigestApi } from "../api/Mock/MockBillDigestApi";
// import { MockLmsTaskActionApi } from "../api/Mock/MockLmsTaskActionApi";
// import { LmsTaskActionApi } from "../api/Lists/LmsTaskActionApi";
// import { RollCallApi } from "../api/Lists/RollCallApi";
// import { MockRollCallApi } from "../api/Mock/MockRollCallApi";
// import { ILegislatorsApi } from "../interfaces/ILegislatorsApi";
// import { MockLegislatorsApi } from "../api/Mock/MockLegislatorsApi";
// import { LegislatorsApi } from "../api/Lists/LegislatorsApi";
// import { CommitteesApi } from "../api/Lists/CommitteesApi";
// import { ICommitteesApi } from "../interfaces/ICommitteesApi";
// import { MockCommitteesApi } from "../api/Mock/MockCommitteesApi";
// import { ListBaseApi } from "../api/Lists/ListBaseApi";
// import { BillStateApi } from "../api/Lists/BillStateApi";
// import { SessionLawsApi } from "../api/Lists/SessionLawsApi";

// export class ServiceHelper {
//     // public getBillDraftApi(isLocalEnvironment:boolean):void{
//     public getConfigurationApi(isLocalEnvironment: boolean): ILmsConfigurationApi {
//         return isLocalEnvironment ? MockLmsConfigurationApi.getInstance() : LmsConfigurationApi.getInstance();
//     }

//     public getBillDraftApi(isLocalEnvironment: boolean): IListApi<IBillDraftRequest> {
//         return isLocalEnvironment ? new MockBillDraftApi() : new BillDraftApi();
//     }

//     public getBillsApi(isLocalEnvironment: boolean): IBillApi {
//         return isLocalEnvironment ? new MockBillApi() : new BillApi();
//     }

//     public getLmsTaskApi(isLocalEnvironment: boolean): ILmsTaskApi {
//         return isLocalEnvironment ? new MockLmsTaskApi() : new LmsTaskApi();
//     }

//     public getWorkflowDefinitionApi(isLocalEnvironment: boolean): IWorkflowDefinitionApi {
//         return isLocalEnvironment ? new MockWorkflowDefinitionApi() : new WorkflowDefinitionApi();
//     }

//     public getSequenceNumberApi(isLocalEnvironment: boolean): IListApi<ISequenceNumbers> {
//         return isLocalEnvironment ? new MockSequenceNumbersApi() : new SequenceNumbersApi();
//     }

//     public getElementsAffectedApi(isLocalEnvironment: boolean): IElementsAffectedApi {
//         return ;
//     }

//     public getActionDefinitionApi(isLocalEnvironment: boolean): IActionDefinitionApi {
//         return isLocalEnvironment ? new MockActionDefinitionApi() : new ActionDefinitionApi();
//     }

//     public getWorkflowStepActionApi(isLocalEnvironment: boolean): IWorkflowStepActionApi {
//         return isLocalEnvironment ? new MockWorkflowStepActionApi() : new WorkflowStepActionApi();
//     }

//     public getAmendmentApi(isLocalEnvironment: boolean): IAmendmentApi {
//         return isLocalEnvironment ? new MockAmendmentApi() : new AmendmentApi();
//     }

//     public getBillDigestApi(isLocalEnvironment: boolean): IBillDigestApi {
//         return isLocalEnvironment ? new MockBillDigestApi() : new BillDigestApi();
//     }

//     public getTaskActionApi(isLocalEnvironment: boolean): IListApi<ITaskAction> {
//         return isLocalEnvironment ? new MockLmsTaskActionApi() : new LmsTaskActionApi();
//     }

//     public getRollCallApi(isLocalEnvironment: boolean): IListApi<IRollCall> {
//         return isLocalEnvironment ? new MockRollCallApi() : new RollCallApi();
//     }

//     public getLegislatorApi(isLocalEnvironment: boolean): ILegislatorsApi {
//         return isLocalEnvironment ? new MockLegislatorsApi() : new LegislatorsApi();
//     }

//     public getCommitteeApi(isLocalEnvironment: boolean): ICommitteesApi {
//         return isLocalEnvironment ? new MockCommitteesApi() : new CommitteesApi();
//     }

//     public getBillStateApi(isLocalEnvironment: boolean): ListBaseApi<IBillState> {
//         return new BillStateApi();
//     }

//     public getSessionLawsApi(isLocalEnvironment: boolean): ISessionLawsApi {
//         return new SessionLawsApi();
//     }
// }

// export let serviceHelper: ServiceHelper = new ServiceHelper();
