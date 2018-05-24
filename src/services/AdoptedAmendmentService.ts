import {
    IBills,
    IWorkflowDefinition,
    IWorkflowDefinitionApi,
    IListApi,
    ITaskAction,
    ILmsTaskApi,
    IAmendments,
    IAmendmentApi,
    IFile,
    ITasks,
    IAmendmentEntity,
    McsUtil,
    WorkflowLogic,
    apiHelper,
} from "mcs-lms-core";

export class AdoptedAmendmentService {
    constructor(private _isLocalEnvironment: boolean) {
    }

    public getAdoptedAmendments(bill: IBills): Promise<IAmendmentEntity[]> {
        return new Promise<IAmendmentEntity[]>((resolve, reject) => {
            let houseOfOrigin: string = bill.HouseofOrigin;
            if (/Senate/gi.test(houseOfOrigin) || /House/gi.test(houseOfOrigin)) {
                let oppositeChamber: string = "Senate";
                if (/Senate/gi.test(houseOfOrigin)) {
                    oppositeChamber = "House";
                    houseOfOrigin = "Senate";
                } else {
                    houseOfOrigin = "House";
                }
                if (WorkflowLogic.IsBudgetBill(bill)) {
                    Promise.all([this.getBillAmendments(bill, houseOfOrigin, true, false),
                    this.getBillAmendments(bill, oppositeChamber, true, false)]).
                        then((response) => {
                            const houseOfOriginAmendments: IAmendmentEntity[] = McsUtil.isArray(response[0]) ? response[0].sort(amendmentEntityComparer) : [];
                            const oppositeChamberAmendments: IAmendmentEntity[] = McsUtil.isArray(response[1]) ? response[1].sort(amendmentEntityComparer) : [];
                            resolve(houseOfOriginAmendments.concat(oppositeChamberAmendments));
                        });
                } else {
                    this.getBillAmendments(bill, oppositeChamber, true, false)
                        .then((response) => {
                            const oppositeChamberAmendments: IAmendmentEntity[] = McsUtil.isArray(response) ? response.sort(amendmentEntityComparer) : [];
                            resolve(oppositeChamberAmendments);
                        });
                }
            } else {
                resolve(null);
            }
        });
    }

    public getBillAmendments(bill: IBills, actionChamber: string, includePassed: boolean, includeFailed: boolean, filterByDate?: Date): Promise<IAmendmentEntity[]> {
        return new Promise<IAmendmentEntity[]>((resolve, reject) => {
            const dipositionTextPassed: string = includePassed ? "Passed" : "Exclude";
            const dipositionTextFailed: string = includeFailed ? "Failed" : "Exclude";
            let actionDate: string = "1/01/2001";
            if (McsUtil.isDefined(filterByDate) && McsUtil.isFunction(filterByDate.format)) {
                actionDate = filterByDate.format("M/dd/yyyy");
            }
            // get all workflow steps for actionChamber
            this._getWorkflowStepsForChamber(actionChamber).then((steps) => {
                if (steps.length > 0) {
                    this._getTasksForSteps(bill, steps.map((s) => s.Id)).then((tasks: ITasks[]) => {
                        const filter: string = `BillLookupId eq ${bill.Id} and (` + tasks.map((v) => `TaskLookupId eq ${v.Id}`).join(" or ") +
                            `) and AmendmentLookupId ne null and (ActionDisposition eq '${dipositionTextPassed}' or ActionDisposition eq '${dipositionTextFailed}')` +
                            ` and ActionDate ge '${actionDate}'`;
                        const taskActionApi: IListApi<ITaskAction> = apiHelper.getTaskActionApi(this._isLocalEnvironment);
                        taskActionApi.getListItems(filter, ["Id", "AmendmentLookupId"], [])
                            .then((taskActionResult) => {
                                if (taskActionResult.length > 0) {
                                    this._getAmendment(taskActionResult.map((v) => v.AmendmentLookupId))
                                        .then((amendments: IAmendments[]) => {
                                            amendments.map((v): IAmendmentEntity => {
                                                let dipositionText: string = "";
                                                if (includeFailed !== includePassed) {
                                                    dipositionText = includeFailed ? "Failed" : (includePassed ? "Passed" : "");
                                                } else {
                                                    const taskActionFilter: ITaskAction[] = taskActionResult.filter((t) => {
                                                        return t.AmendmentLookupId === v.Id;
                                                    });
                                                    if (taskActionFilter.length > 0) {
                                                        dipositionText = taskActionFilter[0].ActionDisposition;
                                                    }
                                                }
                                                const entity: IAmendmentEntity = v as IAmendmentEntity;
                                                entity.Disposition = dipositionText;
                                                entity.Chamber = actionChamber;
                                                return entity;
                                            });
                                        });
                                } else {
                                    resolve([]);
                                }
                            });
                    });
                } else {
                    resolve([]);
                }
            });

        });
    }

    private _getWorkflowStepsForChamber(actionChamber: string): Promise<IWorkflowDefinition[]> {
        return new Promise<IWorkflowDefinition[]>((resolve, reject) => {
            const workflowDefinitionApi: IWorkflowDefinitionApi = apiHelper.getWorkflowDefinitionApi(this._isLocalEnvironment);
            workflowDefinitionApi.getListItems(`Chamber eq '${actionChamber}'`, ["Step", "Id"], [])
                .then((result: IWorkflowDefinition[]) => {
                    resolve(result);
                });
        });
    }

    private _getTasksForSteps(bill: IBills, steps: number[]): Promise<ITasks[]> {
        return new Promise<ITasks[]>((resolve, reject) => {
            const lmsTaskApi: ILmsTaskApi = apiHelper.getLmsTaskApi(this._isLocalEnvironment);
            const filter: string = `BillLookupId eq ${bill.Id} and (` + steps.map((v) => `WorkflowStepNumber eq ${v}`).join(" or ") + ")";
            lmsTaskApi.getListItems(filter, ["Id"], []).then((result: ITasks[]) => {
                resolve(result);
            });
        });
    }

    private _getAmendment(amendmentId: number[]): Promise<IAmendments[]> {
        return new Promise<IAmendments[]>((resolve, reject) => {
            const amendmentApi: IAmendmentApi = apiHelper.getAmendmentApi(this._isLocalEnvironment);
            const select: string[] = [
                "AmendmentNumber",
                "AmendmentStatus",
                "Sponsor",
                "PostedAction",
                "AppliedToEngrossed",
                "IsCorrectedCopy",
                "IsCorrectedToCorrectedCopy",
                "IsDividedAmendment",
            ];
            const filter: string = amendmentId.map((v) => `Id eq ${v}`).join(" or ");
            amendmentApi.getListItems(filter, select, ["File"], "AmendmentNumber", true).then((result) => {
                resolve(result);
            });
        });
    }
}

function amendmentEntityComparer(entity1: IAmendmentEntity, entity2: IAmendmentEntity): number {
    if (!McsUtil.isDefined(entity1)) {
        if (!McsUtil.isDefined(entity2)) {
            return 0;
        }
        return -1;
    }
    if (!McsUtil.isDefined(entity2)) {
        return 1;
    }
    return amendmentComparer(entity1.AmendmentNumber, entity2.AmendmentNumber);
}

// tslint:disable:no-empty
// tslint:disable:no-unused-expression
export function amendmentComparer(amendmentNumber1: string, amendmentNumber2: string): number {
    if (!McsUtil.isString(amendmentNumber1) && !McsUtil.isString(amendmentNumber2)) { return 0; }
    if (!McsUtil.isString(amendmentNumber1) || !McsUtil.isString(amendmentNumber2)) {
        if (!McsUtil.isString(amendmentNumber1)) {
            return -1;
        }
        return 1;
    }
    if (amendmentNumber1.length < 11 || amendmentNumber2.length < 11) {
        return amendmentNumber1.localeCompare(amendmentNumber2);
    }
    const billnumberMaxLength: number = 6;
    const billnumber: string = amendmentNumber1.substring(0, billnumberMaxLength);
    const billNumberCompareValue: number = billnumber.localeCompare(amendmentNumber2.substring(0, billnumberMaxLength));
    if (billNumberCompareValue !== 0) {
        return billNumberCompareValue;
    }
    const readingCompareValue: number = getReading(amendmentNumber1[billnumberMaxLength]).localeCompare(amendmentNumber2[billnumberMaxLength]);
    if (readingCompareValue !== 0) {
        return readingCompareValue;
    }
    return amendmentNumber1.localeCompare(amendmentNumber2);

    function getReading(reading: string): string {
        if (reading === "S" || reading === "s") {
            return "0";
        }
        if (reading === "W" || reading === "w") {
            return "1";
        }
        if (reading === "2") {
            return "2";
        }
        if (reading === "3") {
            return "3";
        }
        return "0";
    }
}