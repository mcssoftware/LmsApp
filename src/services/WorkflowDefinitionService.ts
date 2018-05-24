import { IBills, IWorkflowDefinition, IWorkflowDefinitionApi, IBillState, apiHelper, McsUtil, TextTokenReplacement } from "mcs-lms-core";

export class WorkflowDefinitionService {
    private _workflowDefinitionApi: IWorkflowDefinitionApi;
    constructor(private isLocalEnvironment: boolean) {
        this._workflowDefinitionApi = apiHelper.getWorkflowDefinitionApi(isLocalEnvironment);
    }

    public getByStepNumber(stepNumber: number): Promise<IWorkflowDefinition> {
        return new Promise<IWorkflowDefinition>((resolve, reject) => {
            this._workflowDefinitionApi.getSteps(...[stepNumber])
                .then((result: IWorkflowDefinition[]) => {
                    if (result.length > 0) {
                        resolve(result[0]);
                    }
                    else {
                        resolve(null);
                    }
                }, () => { resolve(null); });
        });
    }

    public getSeedingStep(bill: IBills): Promise<IWorkflowDefinition> {
        return new Promise<IWorkflowDefinition>((resolve, reject) => {
            this._workflowDefinitionApi.getSteps(10)
                .then((resultSteps: IWorkflowDefinition[]) => {
                    const initialStep: IWorkflowDefinition = resultSteps[0];
                    const nextSteps: number[] = this._getNextSteps(initialStep.OnApproveNext);
                    let stepToGet: number = nextSteps[0];
                    if (bill.DrafterId > 0) {
                        stepToGet = nextSteps[nextSteps.length - 1];
                    }
                    this._workflowDefinitionApi.getSteps(stepToGet)
                        .then((steps: IWorkflowDefinition[]) => {
                            resolve(steps[0]);
                        }, (err) => { reject(err); });
                }, (err) => { reject(err); });
        });
    }

    public getNextSteps(step: IWorkflowDefinition): Promise<IWorkflowDefinition[]> {
        return new Promise<IWorkflowDefinition[]>((resolve, reject) => {
            const nextSteps: number[] = this._getNextSteps(step.OnApproveNext).filter((x) => McsUtil.isNumberString(x.toString()));
            if (nextSteps != null) {
                this._workflowDefinitionApi.getSteps(...nextSteps)
                    .then((result: IWorkflowDefinition[]) => {
                        resolve(result.sort((a, b) => {
                            let aindex: number = nextSteps.indexOf(a.Step);
                            if (aindex < 0) { aindex = 99; }
                            let bindex: number = nextSteps.indexOf(b.Step);
                            if (bindex < 0) { bindex = 99; }
                            return aindex - bindex;
                        }));
                    }, (err) => { reject(err); });
            }
            else {
                resolve([]);
            }
        });
    }

    public getReminderSteps(step: IWorkflowDefinition): Promise<IWorkflowDefinition[]> {
        return new Promise<IWorkflowDefinition[]>((resolve, reject) => {
            const nextSteps: number[] = this._getNextSteps(step.ReminderTasks);
            if (nextSteps != null) {
                this._workflowDefinitionApi.getSteps(...nextSteps)
                    .then((result: IWorkflowDefinition[]) => {
                        resolve(result);
                    }, (err) => { reject(err); });
            }
            else {
                resolve([]);
            }
        });
    }

    public getChildSteps(step: IWorkflowDefinition): Promise<IWorkflowDefinition[]> {
        return new Promise<IWorkflowDefinition[]>((resolve, reject) => {
            const nextSteps: number[] = this._getNextSteps(step.ChildSteps);
            if (nextSteps != null) {
                this._workflowDefinitionApi.getSteps(...nextSteps)
                    .then((result: IWorkflowDefinition[]) => {
                        resolve(result);
                    }, (err) => { reject(err); });
            }
            else {
                resolve([]);
            }
        });
    }

    public hasChildSteps(step: IWorkflowDefinition): boolean {
        return this._getNextSteps(step.ChildSteps) !== null;
    }

    public hasNextSteps(step: IWorkflowDefinition): boolean {
        return this._getNextSteps(step.OnApproveNext) !== null;
    }

    public GetBillStateOnCompletion(bill: IBills, workflowStep: IWorkflowDefinition): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (McsUtil.isDefined(workflowStep.LookupBillStateTitle)) {
                const tokenReplacement: TextTokenReplacement = new TextTokenReplacement();
                if (McsUtil.isDefined(bill)) {
                    let sponsorTypeValue: string = "Committee";
                    if (McsUtil.isString(bill.SponsorTitle)) {
                        sponsorTypeValue = "Legislator";
                    }
                    tokenReplacement.addToken("SponsorType", sponsorTypeValue);
                }
                const docStatus: string = bill.DocumentStatus;
                if (McsUtil.isString(docStatus) && (/Numbered/gi).test(docStatus)) {
                    tokenReplacement.addToken("Introduced", "Introduced");
                } else {
                    tokenReplacement.addToken("Introduced", "");
                }
                resolve(tokenReplacement.performTokenReplacement(workflowStep.LookupBillStateTitle.Title));
            } else {
                resolve(null);
            }
        });
    }

    private _getNextSteps(nextStepValue: string): number[] | null {
        if (McsUtil.isString(nextStepValue)) {
            return nextStepValue.split(";").map((stepValue: string): number => {
                return parseInt(stepValue, 10);
            });
        }
        return null;
    }
}
