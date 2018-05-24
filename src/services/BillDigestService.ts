import {
    IWorkflowStepActionApi,
    ITaskAction,
    IListApi,
    IWorkflowDefinition,
    IActionDefinitionApi,
    IActionDefinition,
    IBills,
    ITasks,
    IRollCall,
    IAmendments,
    IBillDigestApi,
    IBillDigest,
    IAmendmentApi,
    apiHelper,
} from "mcs-lms-core";

export class BillDigestService {
    private _billDigestApi: IBillDigestApi;

    constructor(private isLocalEnvironment: boolean) {
        this._billDigestApi = apiHelper.getBillDigestApi(isLocalEnvironment);
    }

    public getBillDigestForTask(task: ITasks): Promise<IBillDigest[]> {
        return this._billDigestApi.getBillDigestForTask(task);
    }

}