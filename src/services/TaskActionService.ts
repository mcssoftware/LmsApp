import {
    IWorkflowStepActionApi, ITaskAction, IListApi, IWorkflowDefinition, IActionDefinitionApi, IActionDefinition,
    IBills, ITasks, IRollCall, IAmendments, IBillDigestApi, IBillDigest, IAmendmentApi, apiHelper, McsUtil, WorkflowLogic,
} from "mcs-lms-core";
import { HttpClient } from "@microsoft/sp-http";
import { IRollCallApi } from "mcs-lms-core/lib/interfaces/IRollCallApi";
import { TasksServices } from "./TasksService";

export class TaskActionService {
    private _taskActionApi: IListApi<ITaskAction>;
    private _workflowStepActionApi: IWorkflowStepActionApi;
    private _actionDefinitionApi: IActionDefinitionApi;
    private _billDigestApi: IBillDigestApi;
    private _isVetoTask: boolean;
    private _bill: IBills;
    private _task: ITasks;
    private _step: IWorkflowDefinition;

    constructor(private isLocalEnvironment: boolean) {
        this._workflowStepActionApi = apiHelper.getWorkflowStepActionApi(isLocalEnvironment);
        this._taskActionApi = apiHelper.getTaskActionApi(isLocalEnvironment);
        this._billDigestApi = apiHelper.getBillDigestApi(isLocalEnvironment);
        this._actionDefinitionApi = apiHelper.getActionDefinitionApi(isLocalEnvironment);
    }

    public getActionForStep(step: IWorkflowDefinition): Promise<IActionDefinition[]> {
        return new Promise<IActionDefinition[]>((resolve, reject) => {
            this._workflowStepActionApi.getWorkflowStepActionIdForStep(step.Id)
                .then((stepNumbers: number[]) => {
                    if (McsUtil.isArray(stepNumbers) && stepNumbers.length > 0) {
                        const filter: string = (stepNumbers.map((v) => {
                            return "Id eq " + v.toString();
                        })).join(" or ");
                        this._actionDefinitionApi.getListItems(filter)
                            .then((actions) => {
                                resolve(actions);
                            }, (err) => { reject(err); });
                    } else {
                        resolve([]);
                    }
                }, (err) => { reject(err); });
        });

    }

    public getTaskAction(task: ITasks): Promise<ITaskAction[]> {
        return this._taskActionApi.getListItems("TaskLookupId eq " + task.Id);
    }

    public getRollCall(httpClient: HttpClient, token: string, bill: IBills, voteId?: number): Promise<IRollCall[]> {
        return new Promise<IRollCall[]>((resolve, reject) => {
            const rollCallApi: IRollCallApi = apiHelper.getRollCallApi(this.isLocalEnvironment);
            let filter: string = `BillNumber eq '${bill.BillNumber}'`;
            if (McsUtil.isNumeric(voteId)) {
                filter = `${filter} and VoteId eq ${voteId}`;
            }
            rollCallApi.getItems(httpClient, token, `Year eq ${bill.BillYear} and BillNumber eq '${bill.BillNumber}'`).then((result) => {
                resolve(result);
            }, () => {
                resolve([]);
            });
        });
    }

    public getRollCallAppliedToOtherTasks(bill: IBills, task: ITasks): Promise<number[]> {
        return new Promise<number[]>((resolve, reject) => {
            this._taskActionApi.getListItems(`BillLookupId eq ${bill.Id} and TaskLookupId ne ${task.Id} and VoteID ne null`, ["VoteID"], [])
                .then((result) => {
                    resolve(result.filter((r) => McsUtil.isNumeric(r.VoteID)).map((r) => parseInt(r.VoteID, 10)));
                });
        });
    }

    public getAmendmentById(id: number): Promise<IAmendments> {
        const amendmentApi: IListApi<IAmendments> = apiHelper.getAmendmentApi(this.isLocalEnvironment);
        return amendmentApi.getListItemById(id);
    }

    public getAmendments(bill: IBills, isVetoTask: boolean, jccNumber: string): Promise<IAmendments[]> {
        return new Promise<IAmendments[]>((resolve, reject) => {
            const amendmentApi: IListApi<IAmendments> = apiHelper.getAmendmentApi(this.isLocalEnvironment);
            if (McsUtil.isString(jccNumber)) {
                amendmentApi.getListItems(`BillLookupId eq ${bill.Id} and substringof('${jccNumber}',AmendmentNumber)`, null, ["Drafter"], "AmendmentNumber", true)
                    .then((amendments) => {
                        resolve(amendments);
                    });
            } else {
                if (isVetoTask) {
                    amendmentApi.getListItems(`BillLookupId eq ${bill.Id} and substringof('VT',AmendmentNumber)`, null, ["Drafter"], "AmendmentNumber", true)
                        .then((amendments) => {
                            resolve(amendments);
                        });
                } else {
                    amendmentApi.getListItems(`BillLookupId eq ${bill.Id} and substringof('DISTRIBUTION',AmendmentStatus)`, null, ["Drafter"], "AmendmentNumber", true)
                        .then((amendments) => {
                            resolve(amendments);
                        });
                }
            }

        });
    }

    public addTaskAction(message: string, bill: IBills, task: ITasks, action: IActionDefinition,
        amendment: IAmendments, rollCall: IRollCall): Promise<ITaskAction> {
        return new Promise<ITaskAction>((resolve, reject) => {
            if (!McsUtil.isString(message)) {
                reject("Message is required.");
            }
            if (!McsUtil.isDefined(bill) || !McsUtil.isUnsignedInt(bill.Id)) {
                reject("Bill is required");
            }
            if (!McsUtil.isDefined(task) || !McsUtil.isDefined(task.WorkflowStepNumber)) {
                reject("Task is required");
            }
            if (!McsUtil.isDefined(action) || !McsUtil.isUnsignedInt(action.Id)) {
                reject("Task is required");
            }
            const taskActionProperty: ITaskAction = {
                BillStatusMessage: message,
                Title: task.WorkflowStep.Title + " : " + message,
                ActionDate: new Date(Date.now()),
                BillLookupId: bill.Id,
                TaskLookupId: task.Id,
                ActionLookupId: action.Id,
                ActionDisposition: action.ActionDisposition,
            };
            if (McsUtil.isDefined(amendment) && McsUtil.isUnsignedInt(amendment.Id)) {
                taskActionProperty.AmendmentLookupId = amendment.Id;
            }
            if (McsUtil.isDefined(rollCall) && McsUtil.isUnsignedInt(rollCall.Id)) {
                taskActionProperty.VoteID = rollCall.VoteId.toString();
            }
            this._taskActionApi.addNewItem(taskActionProperty)
                .then((taskAction: ITaskAction) => {
                    Promise.all([this._createBillDigest(taskAction, task, action),
                    this._updateAmendmentStatus(amendment, action, bill, task)])
                        .then(() => {
                            taskAction.BillLookup = bill;
                            taskAction.AmendmentLookup = amendment;
                            resolve(taskAction);
                        });
                }, (err) => { reject(err); });
        });
    }

    public deleteTaskAction(taskAction: ITaskAction): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._billDigestApi.getBillDigetForTaskAction(taskAction)
                .then((billDigests: IBillDigest[]) => {
                    const amendmentLookupId: number = taskAction.AmendmentLookupId;
                    this._taskActionApi.deleteItem(taskAction.Id).then(() => {
                        if (billDigests.length > 0) {
                            Promise.all(billDigests.map((b) => this._deleteBillDigest(b)))
                                .then(() => {
                                    resolve();
                                });
                        } else {
                            resolve();
                        }
                    }, (err) => { reject(err); });
                });
        });
    }

    private _deleteBillDigest(billDigest: IBillDigest): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._billDigestApi.deleteItem(billDigest.Id).then(() => {
                resolve();
            }, (err) => { reject(err); });
        });
    }

    private _createBillDigest(taskAction: ITaskAction, task: ITasks, action: IActionDefinition): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // to ensure ordering of bill digest.
            if (task.WorkflowStep.BillDigestReportable && action.BillDigestReportable) {
                setTimeout(() => {
                    const billDigestApi: IBillDigestApi = apiHelper.getBillDigestApi(this.isLocalEnvironment);
                    const message: string = taskAction.BillStatusMessage;
                    const newDigest: IBillDigest = {
                        Title: task.WorkflowStep.StepTitle + " : " + message,
                        Message: message,
                        StatusDate: new Date(Date.now()),
                        BillDigestReportable: action.BillDigestReportable,
                        BillStatusReportable: action.BillStatusReportable,
                        BillLookupId: taskAction.BillLookupId,
                        TaskLookupId: taskAction.TaskLookupId,
                        Duplicate: false,
                        AmendmentLookupId: taskAction.AmendmentLookupId,
                        VoteID: taskAction.VoteID,
                        TaskActionLookupId: taskAction.Id,
                    };
                    billDigestApi.addNewItem(newDigest).then(() => { resolve(); }, (err) => { reject(err); });
                }, 1000);
            } else {
                resolve();
            }
        });
    }

    private _updateAmendmentStatus(amendment: IAmendments, action: IActionDefinition,
        bill: IBills, task: ITasks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (McsUtil.isDefined(amendment) && McsUtil.isUnsignedInt(amendment.Id)) {
                if (McsUtil.isString(action.ActionDisposition)) {
                    let amendmentAction: string = this._getAmendmentAction(action.ActionName, action.ActionDisposition);
                    const taskServices: TasksServices = new TasksServices(this.isLocalEnvironment);
                    if (WorkflowLogic.IsJccTask(task.WorkflowStep, task.BillLookup) && WorkflowLogic.IsVetoOverrideStep(task.WorkflowStep)) {
                        if (amendmentAction.length > 0) {
                            amendmentAction = task.WorkflowStep.Chamber[0].toUpperCase() + amendmentAction;
                            if (McsUtil.isString(task.WorkflowStep.Chamber) && task.WorkflowStep.Chamber.toUpperCase() !== bill.HouseofOrigin.toUpperCase()) {
                                amendmentAction = amendment.PostedAction + amendmentAction;
                            } else {
                                amendmentAction = "/" + amendmentAction;
                            }
                        }
                    }
                    this._updateAmendmentStatusInternal(amendment, action.ActionName, amendmentAction).then(() => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        });
    }

    private _resetAmendmentStatus(taskActionId: number, amendmentLookupId: number, isJccTask: boolean, isVetoTask: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (McsUtil.isNumeric(amendmentLookupId)) {
                this.getAmendmentById(amendmentLookupId)
                    .then((amendment) => {
                        const amendmentApi: IAmendmentApi = apiHelper.getAmendmentApi(this.isLocalEnvironment);
                        const amendmentStatus: string = "APPROVED FOR DISTRIBUTION";
                        if (WorkflowLogic.IsJccTask(this._step, this._bill) || WorkflowLogic.IsVetoOverrideStep(this._step)) {
                            this._taskActionApi.getListItems(`AmendmentLookupId eq ${amendmentLookupId} and Id ne {taskActionId}`)
                                .then((lastTaskActions: ITaskAction[]) => {
                                    if (lastTaskActions.length !== 1) {
                                        this._updateAmendmentStatusInternal(amendment, amendmentStatus, "").then(() => {
                                            resolve();
                                        });
                                    } else {
                                        this._actionDefinitionApi.getListItemById(lastTaskActions[0].ActionLookupId)
                                            .then((action) => {
                                                this._updateAmendmentStatusInternal(amendment, action.ActionName,
                                                    this._getAmendmentAction(action.ActionName, action.ActionDisposition)).then(() => {
                                                        resolve();
                                                    });
                                            },
                                            (err) => {
                                                resolve();
                                            });
                                    }
                                });
                        } else {
                            this._updateAmendmentStatusInternal(amendment, amendmentStatus, "").then(() => {
                                resolve();
                            });
                        }
                    }, () => {
                        resolve();
                    });
            } else {
                resolve();
            }
        });
    }

    private _getAmendmentAction(actionName: string, actionDisposition: string): string {
        let amendmentAction: string = "";
        if ((/passed/gi).test(actionDisposition)) {
            amendmentAction = "ADOPTED";
        } else {
            if ((/failed/gi).test(actionDisposition)) {
                amendmentAction = "FAILED";
            } else {
                if ((/withdrawn/gi).test(status)) {
                    amendmentAction = "WITHDRAWN";
                } else {
                    if (/Reported to/i.test(status)) {
                        amendmentAction = status;
                    }
                }
            }
        }
        return amendmentAction;
    }

    private _updateAmendmentStatusInternal(amendment: IAmendments, amendmentStatus: string, postedAction: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const amendmentApi: IAmendmentApi = apiHelper.getAmendmentApi(this.isLocalEnvironment);
            amendmentApi.updateAmendmentStatus(amendment, amendmentStatus, postedAction)
                .then(() => {
                    resolve();
                }, (err) => { reject(err); });
        });

    }
}