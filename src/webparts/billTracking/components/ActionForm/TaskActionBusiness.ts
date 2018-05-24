import {
    IBills,
    ITasks,
    IWorkflowDefinition,
    IActionDefinition,
    ITaskAction,
    IAmendments,
    IRollCall,
    WorkflowLogic,
    McsUtil,
} from "mcs-lms-core";
import { TaskActionService } from "../../../../services/TaskActionService";
import { Dictionary } from "sp-pnp-js";
import { HttpClient } from "@microsoft/sp-http";

export class TaskActionBusiness {
    private _bill: IBills;
    private _task: ITasks;
    private _step: IWorkflowDefinition;
    private _isLocalEnvironment: boolean;
    private _isVetoTask: boolean;
    private _jccNumber: string;
    private _taskActionServices: TaskActionService;

    private _allActionsForCurrentStep: IActionDefinition[];
    private _taskActionApplied: ITaskAction[];
    private _amendmentsAvailableForTask: IAmendments[];
    private _allRollCallForTask: IRollCall[];

    constructor(isLocalEnvironment: boolean, bill: IBills, task: ITasks, step: IWorkflowDefinition, private _httpClient: HttpClient, private _token: string) {
        this._isLocalEnvironment = isLocalEnvironment;
        this._bill = bill;
        this._task = task;
        this._step = step;
        this._isVetoTask = WorkflowLogic.IsVetoOverrideStep(step);
        if (WorkflowLogic.IsJccTask(step, bill)) {
            this._jccNumber = `JC${McsUtil.padNumber(step.CommitteeID, 3)}`;
        }
        this._taskActionServices = new TaskActionService(isLocalEnvironment);
    }

    public LoadData(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            Promise.all([this._taskActionServices.getActionForStep(this._step),
            this._taskActionServices.getTaskAction(this._task),
            this._taskActionServices.getAmendments(this._bill, this._isVetoTask, this._jccNumber),
            this._taskActionServices.getRollCall(this._httpClient, this._token, this._bill),
            this._taskActionServices.getRollCallAppliedToOtherTasks(this._bill, this._task)])
                .then((response) => {
                    this._allActionsForCurrentStep = response[0];
                    this._taskActionApplied = response[1];
                    this._amendmentsAvailableForTask = response[2];
                    const allRollCallForBill: IRollCall[] = response[3];
                    const rollCallAppliedToOtherTask: number[] = response[4];
                    this._allRollCallForTask = allRollCallForBill.filter((r) => rollCallAppliedToOtherTask.indexOf(r.VoteId) < 0);
                    resolve();
                }, (error) => { reject(error); });
        });
    }

    public getDocuments(key?: string): Dictionary<string> {
        const store: Dictionary<string> = new Dictionary<string>();
        if (McsUtil.isString(this._jccNumber)) {
            this._amendmentsAvailableForTask.forEach((a) => {
                store.add(a.Id.toString(), a.AmendmentNumber.toString());
            });
        } else {
            store.add("0", this._bill.BillNumber);
            this._amendmentsAvailableForTask.forEach((a) => {
                store.add(a.Id.toString(), a.AmendmentNumber.toString());
            });
        }
        return store;
    }

    public getActions(documentKey: string): IActionDefinition[] {
        const isBill: boolean = documentKey === "0";
        return this._allActionsForCurrentStep.filter((a) => {
            return isBill ? !a.AmendmentRequired : a.AmendmentRequired;
        });
    }

    public isVoteRequired(action: IActionDefinition): boolean {
        // tslint:disable-next-line:prefer-for-of
        if (McsUtil.isDefined(action)) {
            return action.VoteIdRequired || action.CommitteeVoteIDRequired;
        }
        return false;
    }

    public getRollCall(documentKey: string, documentValue: string): IRollCall[] {
        const rollCallAppliedToCurrentTask: number[] = this._taskActionApplied
            .filter((t) => McsUtil.isNumeric(t.VoteID))
            .map((t) => parseInt(t.VoteID, 10));
        return this._allRollCallForTask
            .filter((r) => rollCallAppliedToCurrentTask.indexOf(r.VoteId) < 0)
            .filter((r) => documentKey === "0" ? (r.BillNumber === documentValue) && !McsUtil.isDefined(r.AmendmentNumber) : r.AmendmentNumber === documentValue);
    }

    public getTaskActions(): ITaskAction[] {
        return this._taskActionApplied;
    }

    public addTaskAction(documentId: number, actionId: number, actionMessage: string, voteId?: number): Promise<ITaskAction> {
        return new Promise<ITaskAction>((resolve, reject) => {
            const actions: IActionDefinition[] = this._allActionsForCurrentStep.filter((x) => x.Id === actionId);
            let amendment: IAmendments = null;
            if (documentId > 0) {
                const filteredAmedment: IAmendments[] = this._amendmentsAvailableForTask.filter((x) => x.Id === documentId);
                if (filteredAmedment.length > 0) {
                    amendment = filteredAmedment[0];
                }
            }
            let rollcall: IRollCall = null;
            if (voteId > 0) {
                const filteredRollCall: IRollCall[] = this._allRollCallForTask.filter((x) => x.VoteId === voteId);
                if (filteredRollCall.length > 0) {
                    rollcall = filteredRollCall[0];
                }
            }
            this._taskActionServices.addTaskAction(actionMessage, this._bill, this._task, actions[0], amendment, rollcall)
                .then((result: ITaskAction) => {
                    this._taskActionApplied.push(result);
                    if (amendment != null && !WorkflowLogic.IsJccTask(this._step, this._bill) && !WorkflowLogic.IsVetoOverrideStep(this._step)) {
                        this._amendmentsAvailableForTask = this._amendmentsAvailableForTask.filter((a) => a.Id !== amendment.Id);
                    }
                    if (voteId > 0) {
                        this._allRollCallForTask = this._allRollCallForTask.filter((x) => x.VoteId !== voteId);
                    }
                    resolve(result);
                }, (error) => {
                    reject(error);
                });
        });
    }

    public removeTaskAction(taskAction: ITaskAction): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const voteId: number = parseInt(taskAction.VoteID, 10);
            const amendmentLookupId: number = taskAction.AmendmentLookupId;
            const taskActionId: number = taskAction.Id;
            this._taskActionServices.deleteTaskAction(taskAction)
                .then(() => {
                    this._taskActionApplied = this._taskActionApplied.filter((t) => t.Id !== taskActionId);
                    Promise.all([this._getDeletedVote(voteId), this._getDeletedAmendment(amendmentLookupId)])
                        .then((response) => {
                            resolve();
                        });
                });

        });
    }

    public getActionsById(actionId: number): IActionDefinition {
        const actions: IActionDefinition[] = this._allActionsForCurrentStep.filter((f) => f.Id === actionId);
        if (actions.length > 0) {
            return actions[0];
        }
        return null;
    }

    public getRollCallById(voteId: number): IRollCall {
        const rollCalls: IRollCall[] = this._allRollCallForTask.filter((f) => f.VoteId === voteId);
        if (rollCalls.length > 0) {
            return rollCalls[0];
        }
        return null;
    }

    public getWorkflowStepTitle(): string {
        return (McsUtil.isString(this._task.WorkflowStep.StepShortTitle) ?
            this._task.WorkflowStep.StepShortTitle : this._task.WorkflowStep.StepTitle).trim();
    }

    public getJccNumber(): string {
        if (McsUtil.isString(this._jccNumber)) {
            return `${this._bill.BillNumber}${this._jccNumber}`;
        }
        return "";
    }

    public getChamber(): string {
        if (McsUtil.isDefined(this._step.Chamber)) {
            return this._step.Chamber;
        }
        return "";
    }

    private _getDeletedVote(voteId?: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (McsUtil.isDefined(voteId)) {
                this._taskActionServices.getRollCall(this._httpClient, this._token, this._bill, voteId)
                    .then((result) => {
                        if (result.length > 0) {
                            this._allRollCallForTask.push(result[0]);
                        }
                    }, () => {
                        resolve();
                    });
            } else {
                resolve();
            }
        });
    }

    private _getDeletedAmendment(amendmentId?: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (McsUtil.isNumeric(amendmentId) && !WorkflowLogic.IsJccTask(this._step, this._bill) && !WorkflowLogic.IsVetoOverrideStep(this._step)) {
                this._taskActionServices.getAmendmentById(amendmentId)
                    .then((result) => {
                        this._amendmentsAvailableForTask.push(result);
                    });
            } else {
                resolve();
            }
        });
    }
}