import {
    ILmsTaskApi, IBills, IWorkflowDefinitionApi, IWorkflowDefinition, ITasks,
    IBillDigestApi, IBillDigest, IBillApi, IBillState, IUser, apiHelper, McsUtil, Constants, config, TextTokenReplacement, LmsFormatters, WorkflowLogic,
} from "mcs-lms-core";
import { IHttpClientOptions, HttpClient, HttpClientResponse } from "@microsoft/sp-http";
import { WorkflowDefinitionService } from "./WorkflowDefinitionService";
import { SessionLawsService } from "./SessionLawsService";
import { SequenceNumbersService } from "./SequenceNumbersService";
import { ListService } from "./ListService";

export class TasksServices {
    private _lmsTaskApi: ILmsTaskApi;
    private _billsApi: IBillApi;
    private _workflowDefinitionApi: IWorkflowDefinitionApi;
    private _workFlowService: WorkflowDefinitionService;
    private _sessionLawService: SessionLawsService;
    private _sequenceNumberService: SequenceNumbersService;

    constructor(private isLocalEnvironment: boolean) {
        this._lmsTaskApi = apiHelper.getLmsTaskApi(this.isLocalEnvironment);
        this._billsApi = apiHelper.getBillsApi(isLocalEnvironment);
        this._workflowDefinitionApi = apiHelper.getWorkflowDefinitionApi(isLocalEnvironment);
        this._workFlowService = new WorkflowDefinitionService(isLocalEnvironment);
        this._sessionLawService = new SessionLawsService(isLocalEnvironment);
        this._sequenceNumberService = new SequenceNumbersService(isLocalEnvironment);
    }

    public getTaskById(id: number): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            this._lmsTaskApi.getListItemById(id).then((task) => {
                const promises: Array<Promise<any>> = [this._billsApi.getListItemById(task.BillLookupId), this._workflowDefinitionApi.getSteps(...[task.WorkflowStepNumber])];
                Promise.all(promises).then((responses) => {
                    task.BillLookup = responses[0];
                    task.WorkflowStep = responses[1][0];
                    resolve(task);
                }, (err) => { reject(err); });
            }, (err) => { reject(err); });
        });
    }

    public ensureSeedTask(bill: IBills, draftingInstructions: string): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            if (McsUtil.isDefined(bill)) {
                this._taskExistsForBill(bill)
                    .then((task) => {
                        resolve(task);
                    }, () => {
                        const workflowStepService: WorkflowDefinitionService = new WorkflowDefinitionService(this.isLocalEnvironment);
                        workflowStepService.getSeedingStep(bill)
                            .then((seedStep: IWorkflowDefinition) => {
                                const assignedUser: IUser = McsUtil.getAssignedUser(bill, seedStep);
                                this._createTask(bill, null, seedStep, McsUtil.isDefined(assignedUser) ? assignedUser.Id : bill.DrafterId, "", false, draftingInstructions)
                                    .then((newTask: ITasks) => {
                                        resolve(newTask);
                                    }, (err) => {
                                        reject(err);
                                    });
                            });
                    });
            } else {
                resolve(null);
            }
        });
    }

    public performTaskAction(bill: IBills, currentTask: ITasks, nextStep: IWorkflowDefinition, assignToUserId: number,
        comment: string, isChildren: boolean, isTaskUpdated: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._createTask(bill, currentTask, nextStep, assignToUserId, comment, isChildren, "")
                .then((newTask) => {
                    this.completeTask(bill, currentTask, newTask).then((completedTask) => {
                        const workflowStepService: WorkflowDefinitionService = new WorkflowDefinitionService(this.isLocalEnvironment);
                        if (nextStep !== null) {
                            Promise.all([
                                this._performAutoCompleteAction(workflowStepService, bill, newTask),
                                this._performChildStepActions(workflowStepService, bill, newTask)])
                                .then(() => {
                                    resolve();
                                });

                        } else {
                            resolve();
                        }
                    });
                }, (err) => {
                    reject(err);
                });
        });
    }

    public saveTaskComments(task: ITasks, comments: string): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            const step: IWorkflowDefinition = task.WorkflowStep;
            if (McsUtil.isString(comments)) {
                this._lmsTaskApi.updateItem(task.Id, task["odata.type"], { Comments: comments })
                    .then((): Promise<ITasks> => {
                        return this._lmsTaskApi.getListItemById(task.Id);
                    })
                    .then((updatedTask: ITasks) => {
                        updatedTask.WorkflowStep = step;
                        resolve(updatedTask);
                    }, (err) => { reject(err); });
            } else {
                resolve(task);
            }
        });
    }

    public saveTaskProperties(task: ITasks, property: any): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            const step: IWorkflowDefinition = task.WorkflowStep;
            if (McsUtil.isDefined(property)) {
                this._lmsTaskApi.updateItem(task.Id, task["odata.type"], { TaskProperties: JSON.stringify(property) })
                    .then((): Promise<ITasks> => {
                        return this._lmsTaskApi.getListItemById(task.Id);
                    })
                    .then((updatedTask: ITasks) => {
                        updatedTask.WorkflowStep = step;
                        resolve(updatedTask);
                    }, (err) => { reject(err); });
            } else {
                resolve();
            }
        });
    }

    public getTaskProperties(task: ITasks): any {
        if (McsUtil.isDefined(task) && McsUtil.isString(task.TaskProperties)) {
            try {
                return JSON.parse(task.TaskProperties);
                // tslint:disable-next-line:no-empty
            } catch (e) {
            }
        }
        return {};
    }

    public completeTask(bill: IBills, task: ITasks, nextTask: ITasks): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._lmsTaskApi.updateItem(task.Id, task["odata.type"], { Status: "Completed" })
                .then((value: any) => {
                    this._billsApi.getListItemById(bill.Id)
                        .then((refreshBill: IBills) => {
                            Promise.all([
                                this._updateBillOnTaskCompletion(task, refreshBill),
                                this._createBillDigest(refreshBill, task, nextTask),
                                this._createReminderTasks(refreshBill, task),
                                this._completeParentTask(refreshBill, task),
                                this._createMessage(refreshBill, task),
                            ])
                                .then(() => {
                                    resolve();
                                });
                        }, (err) => { reject(err); });

                }, (err) => { reject(err); });
        });
    }

    public createFormalDraft(task: ITasks, bill: IBills): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            this._getBillPropertiesToUpdate(bill, task.WorkflowStep, true, true, true)
                .then((propertyToUpdate: IBills) => {
                    if (!McsUtil.isDefined(propertyToUpdate)) {
                        propertyToUpdate = {} as IBills;
                    }
                    this._billsApi.updateBillNoBlob(bill, propertyToUpdate, "Formal draft created.", true).then((newBill) => {
                        this.saveTaskProperties(task, { FormalCreated: true }).then((value) => {
                            task.BillLookup = newBill;
                            resolve(task);
                        }, (err) => reject(err));
                    }, (err) => reject(err));
                });
        });
    }

    public convertToNumbered(httpClient: HttpClient, accessToken: string, task: ITasks, bill: IBills, billNumber: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            ListService.getListProperties(this._billsApi.getWeb(), this._billsApi.listTitle)
                .then((listProperty) => {
                    const url: string = `${Constants.ServiceUrl.ConvertToNumbered}?webUrl=${config.getLmsUrl()}&billUrl=${task.BillLookup.File.ServerRelativeUrl}`;
                    const requestHeaders: Headers = new Headers();
                    requestHeaders.append("Content-type", "application/json");
                    requestHeaders.append("Cache-Control", "no-cache");
                    requestHeaders.append("Authorization", "Bearer " + accessToken);

                    const httpClientOptions: IHttpClientOptions = {
                        headers: requestHeaders,
                    };
                    httpClient.get(url, HttpClient.configurations.v1, httpClientOptions)
                        .then((response: HttpClientResponse) => {
                            if (response.ok) {
                                return response.blob();
                            } else {
                                reject(response.statusText);
                            }
                        }, (err) => {
                            reject(err);
                        })
                        .then((billBlob: Blob) => {
                            if (McsUtil.isDefined(billBlob)) {
                                this._getBillPropertiesToUpdate(bill, task.WorkflowStep, true, true, true)
                                    .then((propertyToUpdate: IBills) => {
                                        if (!McsUtil.isDefined(propertyToUpdate)) {
                                            propertyToUpdate = {} as IBills;
                                        }
                                        propertyToUpdate.BillNumber = billNumber;
                                        this._billsApi.updateBill(task.BillLookup, propertyToUpdate, billBlob, "Bill numbered", true).then((newBill) => {
                                            this.saveTaskProperties(task, { BillNumbered: true }).then((value) => {
                                                task.BillLookup = newBill;
                                                resolve({ task: value, bill: newBill });
                                            }, (err) => reject(err));
                                        }, (err) => reject(err));
                                    });
                            }
                        });

                }, (err) => { reject(err); });
        });
    }

    public assignEnrollNumber(httpClient: HttpClient, accessToken: string, task: ITasks, billEffectiveDate: string | Date): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            billEffectiveDate = this._formatDate(billEffectiveDate);
            this._sequenceNumberService.getNextSequenceNumber(/senate/gi.test(task.BillLookup.HouseofOrigin) ?
                Constants.SequenceNumberType.SenateEnrolledNumber : Constants.SequenceNumberType.HouseEnrolledNumber).then((sequenceNumber: number) => {
                    ListService.getListProperties(this._billsApi.getWeb(), this._billsApi.listTitle)
                        .then((listProperty) => {
                            const url: string = `${Constants.ServiceUrl.CreateEnrolled}?webUrl=${config.getLmsUrl()}&listId=${listProperty.Id}` +
                                `&templateUrl=${Constants.LmsTemplates.EnrolledBillTemplateFileName}&sequenceNumber=${sequenceNumber}`;
                            const requestHeaders: Headers = new Headers();
                            requestHeaders.append("Content-type", "application/json");
                            requestHeaders.append("Cache-Control", "no-cache");
                            requestHeaders.append("Authorization", "Bearer " + accessToken);

                            const httpClientOptions: IHttpClientOptions = {
                                headers: requestHeaders,
                            };
                            httpClient.get(url, HttpClient.configurations.v1, httpClientOptions)
                                .then((response: HttpClientResponse) => {
                                    if (response.ok) {
                                        return response.blob();
                                    } else {
                                        reject(response.statusText);
                                    }
                                }, (err) => {
                                    reject(err);
                                })
                                .then((billBlob: Blob) => {
                                    if (McsUtil.isDefined(billBlob)) {
                                        const propertyToUpdate: any = {};
                                        propertyToUpdate.EnrolledNumber = sequenceNumber;
                                        if (McsUtil.isString(billEffectiveDate.toString())) {
                                            propertyToUpdate.BillEffectiveDate = billEffectiveDate.toString();
                                        }
                                        this._billsApi.updateBill(task.BillLookup, propertyToUpdate, billBlob, "Assigned enrolled number", true).then((newBill) => {
                                            this.saveTaskProperties(task, { EnrollNumber: 1 }).then((value) => {
                                                task.BillLookup = newBill;
                                                resolve(value);
                                            }, (err) => reject(err));
                                        }, (err) => reject(err));
                                    }
                                });

                        }, (err) => { reject(err); });
                });
        });
    }

    public assignFiscalAnalyst(bill: IBills, userId: number): Promise<IBills> {
        return new Promise<IBills>((resolve, reject) => {
            this._billsApi.updateBillNoBlob(bill, { FiscalAnalystUserId: userId } as IBills, "Fiscal analyst assigned to bill.", false).then((result) => {
                resolve(result);
            }, (err) => reject(err));
        });
    }

    public assignChapterNumberToBill(bill: IBills, task: ITasks, assignedChapterNumber: number,
        chapterSignedDate: string | Date, billEffectiveDate: string | Date): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            this._getBillPropertiesToUpdate(bill, task.WorkflowStep, true, true, true)
                .then((propertyToUpdate: IBills) => {
                    if (!McsUtil.isDefined(propertyToUpdate)) {
                        propertyToUpdate = {} as IBills;
                    }
                    chapterSignedDate = this._formatDate(chapterSignedDate);
                    billEffectiveDate = this._formatDate(billEffectiveDate);
                    if (McsUtil.isNumberString(assignedChapterNumber.toString()) && assignedChapterNumber > 0) {
                        propertyToUpdate.ChapterNumber = assignedChapterNumber.toString();
                        propertyToUpdate.ChapterSignedOn = chapterSignedDate;
                    }
                    if (McsUtil.isString(billEffectiveDate.toString())) {
                        propertyToUpdate.BillEffectiveDate = billEffectiveDate;
                    }
                    this._billsApi.updateBillNoBlob(bill, propertyToUpdate, "Chapter number assigned.", true).then((newBill) => {
                        this.saveTaskProperties(task, { ChapterSignedDate: chapterSignedDate.toString(), ChapterNumber: assignedChapterNumber.toString() }).then((value) => {
                            task.BillLookup = newBill;
                            resolve(task);
                        }, (err) => reject(err));
                    }, (err) => reject(err));
                });
        });
    }

    public createSessionLaw(httpClient: HttpClient, accessToken: string, bill: IBills, task: ITasks, isApproved: boolean): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            this._sessionLawService.createSessionLaws(httpClient, accessToken, bill, isApproved).then((sessionLaw) => {
                this.saveTaskProperties(task, { SessionLawCreated: true }).then((result) => {
                    resolve(result);
                }, (err) => reject(err));
            }, (err) => reject(err));
        });
    }

    public createEngrossedBill(httpClient: HttpClient, accessToken: string, bill: IBills, task: ITasks): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            ListService.getListProperties(this._billsApi.getWeb(), this._billsApi.listTitle)
                .then((listProperty) => {
                    const url: string = `${Constants.ServiceUrl.CreateEngrossed}?webUrl=${config.getLmsUrl()}&billUrl=${bill.File.ServerRelativeUrl}`;
                    const requestHeaders: Headers = new Headers();
                    requestHeaders.append("Content-type", "application/json");
                    requestHeaders.append("Cache-Control", "no-cache");
                    requestHeaders.append("Authorization", "Bearer " + accessToken);
                    const httpClientOptions: IHttpClientOptions = {
                        headers: requestHeaders,
                    };
                    httpClient.get(url, HttpClient.configurations.v1, httpClientOptions)
                        .then((response: HttpClientResponse) => {
                            if (response.ok) {
                                return response.blob();
                            } else {
                                reject(response.statusText);
                            }
                        }, (err) => {
                            reject(err);
                        })
                        .then((billBlob: Blob) => {
                            if (McsUtil.isDefined(billBlob)) {
                                this._getBillPropertiesToUpdate(bill, task.WorkflowStep, true, true, true)
                                    .then((propertyToUpdate: IBills) => {
                                        if (!McsUtil.isDefined(propertyToUpdate)) {
                                            propertyToUpdate = {} as IBills;
                                        }
                                        this._billsApi.updateBill(task.BillLookup, propertyToUpdate, billBlob, "Engrossed bill created", true).then((result) => {
                                            this.saveTaskProperties(task, { EngrossedBillCreated: true }).then((value) => {
                                                resolve(value);
                                            }, (err) => reject(err));
                                        }, (err) => reject(err));
                                    });
                            }
                        });

                }, (err) => { reject(err); });
        });
    }

    private _updateBillOnTaskCompletion(task: ITasks, bill: IBills): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._getBillPropertiesToUpdate(bill, task.WorkflowStep, true, false, false)
                .then((propertyToUpdate: IBills) => {
                    if (!McsUtil.isDefined(propertyToUpdate)) {
                        this._billsApi.updateBillNoBlob(task.BillLookup, propertyToUpdate, `Task step ${task.WorkflowStep.StepTitle} completed.`, true)
                            .then((result) => {
                                resolve();
                            }, (err) => resolve());
                    } else {
                        resolve();
                    }
                }, () => {
                    resolve();
                });
        });
    }

    private _performAutoCompleteAction(workflowStepService: WorkflowDefinitionService, bill: IBills, task: ITasks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const currentStep: IWorkflowDefinition = task.WorkflowStep;
            if (currentStep.AutoComplete) {
                if (workflowStepService.hasNextSteps(currentStep)) {
                    workflowStepService.getNextSteps(currentStep).then((nextOfAutoComplete) => {
                        if (McsUtil.isArray(nextOfAutoComplete) && nextOfAutoComplete.length > 0) {
                            const assignTo: IUser = McsUtil.getAssignedUser(bill, nextOfAutoComplete[0]);
                            this.performTaskAction(bill, task, nextOfAutoComplete[0], McsUtil.isDefined(assignTo) ? assignTo.Id : 0, "", false, false)
                                .then(() => {
                                    resolve();
                                }, (err) => { reject(err); });
                        } else {
                            this.completeTask(bill, task, null)
                                .then(() => {
                                    resolve();
                                }, (err) => { reject(err); });
                        }
                    });
                } else {
                    this.completeTask(bill, task, null)
                        .then(() => {
                            resolve();
                        }, (err) => { reject(err); });
                }
            } else {
                resolve();
            }
        });
    }

    private _performChildStepActions(workflowStepService: WorkflowDefinitionService, bill: IBills, task: ITasks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (workflowStepService.hasChildSteps(task.WorkflowStep)) {
                this._createChildSteps(bill, task)
                    .then(() => {
                        resolve();
                    }, (err) => { reject(err); });
            } else {
                resolve();
            }
        });
    }

    private _formatDate(date: string | Date): string {
        if (McsUtil.isDefined(date)) {
            let dateValue: Date;
            if (McsUtil.isString(date)) {
                dateValue = new Date(date.toString());
                return dateValue.format("MM/dd/yyyy");
            }
            dateValue = date as Date;
            if (McsUtil.isFunction(dateValue.format)) {
                return dateValue.format("MM/dd/yyyy");
            } else {
                return dateValue.toLocaleDateString();
            }
        }
        return "";
    }

    private _createTask(bill: IBills, currentTask: ITasks, nextStep: IWorkflowDefinition,
        assignToUserId: number, comment: string, isChildren: boolean, draftingInstructions: string): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            if (!McsUtil.isDefined(nextStep) && !McsUtil.isUnsignedInt(assignToUserId)) {
                resolve(null);
            } else {
                let previousComments: string = "";
                let previousTaskLookupId: number;
                let parentTaskLookupId: number;
                if (McsUtil.isDefined(currentTask)) {
                    previousTaskLookupId = currentTask.Id;
                    if (isChildren) {
                        parentTaskLookupId = currentTask.Id;
                    }
                    if (McsUtil.isString(currentTask.Comments)) {
                        previousComments = currentTask.Comments;
                    }
                }
                let instructions: string = nextStep.Instructions;
                if (!McsUtil.isString(instructions)) {
                    instructions = "";
                }
                if (McsUtil.isString(draftingInstructions)) {
                    instructions += `<div><span style='font-weight: bold; vertical-align: top;'>Drafting Instruction: </span>${draftingInstructions}</div>`;
                }
                const newItem: ITasks = {
                    Title: nextStep.StepTitle,
                    BillLookupId: bill.Id,
                    WorkflowStepNumber: nextStep.Step,
                    StepType: nextStep.StepType,
                    CommentsFromPreviousTask: previousComments,
                    Body: instructions,
                    ParentLookupId: parentTaskLookupId,
                    AssignedToId: assignToUserId < 1 ? nextStep.AssignedToId : assignToUserId,
                    HasChildren: McsUtil.isArray(nextStep.ChildSteps) && nextStep.ChildSteps.length > 0,
                    StartDate: new Date(),
                    Status: "Not Started",
                    LmsTaskType: nextStep.LmsTaskType,
                    Comments: "",
                    IsChildren: isChildren,
                    CalendarOrder: 999,
                };
                if (previousTaskLookupId > 0) {
                    newItem.PredecessorsId = {
                        results: [previousTaskLookupId],
                    };
                }
                this._lmsTaskApi.addNewItem(newItem).then((newTask: ITasks) => {
                    this._lmsTaskApi.getListItemById(newTask.Id)
                        .then((expandedNewTask: ITasks) => {
                            expandedNewTask.WorkflowStep = nextStep;
                            resolve(expandedNewTask);
                        });
                }, (err) => { reject(err); });
            }
        });
    }

    private _replaceToken(value: string, bill: IBills, currentTask: ITasks, nextTask: ITasks): string {
        if (McsUtil.isString(value)) {
            const tokenReplacement: TextTokenReplacement = new TextTokenReplacement();
            if (McsUtil.isNumberString(bill.ChapterNumber)) {
                tokenReplacement.addToken("ChapterNumber", LmsFormatters.ChapterNumber(parseInt(bill.ChapterNumber, 10)));
            }
            if (McsUtil.isNumberString(bill.EnrolledNumber)) {
                tokenReplacement.addToken("EnrolledNumber", (parseInt(bill.EnrolledNumber, 10)).toString());
                // TODO ensure formatter is working
                tokenReplacement.addToken("EnrollActNumberShort", (parseInt(bill.EnrolledNumber, 10)).toString());
                tokenReplacement.addToken("EnrolledNumberFull", (parseInt(bill.EnrolledNumber, 10)).toString());
            }
            if (McsUtil.isUnsignedInt(currentTask.WorkflowStep.CommitteeID)) {
                tokenReplacement.addToken("JccNumber", "formatJCC");
            }
            tokenReplacement.addToken("CommitteeName", "");
            tokenReplacement.addToken("Action", "");
            if (McsUtil.isDefined(nextTask) && McsUtil.isDefined(nextTask.AssignedTo)) {
                tokenReplacement.addToken("NextAssignedTo", nextTask.AssignedTo.Title);
            } else {
                tokenReplacement.addToken("NextAssignedTo", "");
            }
            if (McsUtil.isDefined(currentTask) && McsUtil.isDefined(currentTask.AssignedTo)) {
                tokenReplacement.addToken("AssignedTo", currentTask.AssignedTo.Title);
            } else {
                tokenReplacement.addToken("AssignedTo", "");
            }
            return tokenReplacement.performTokenReplacement(value);
        }
        return value;
    }

    private _createBillDigest(bill: IBills, currentTask: ITasks, nextTask: ITasks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // to ensure ordering of bill digest.
            setTimeout(() => {
                if (McsUtil.isDefined(currentTask) && McsUtil.isDefined(currentTask.WorkflowStepNumber) && currentTask.WorkflowStep.BillDigestReportable) {
                    const billDigestApi: IBillDigestApi = apiHelper.getBillDigestApi(this.isLocalEnvironment);
                    const message: string = McsUtil.isString(currentTask.WorkflowStep.StepShortTitle) ?
                        currentTask.WorkflowStep.StepShortTitle :
                        currentTask.WorkflowStep.StepTitle;
                    const newDigest: IBillDigest = {
                        Title: currentTask.WorkflowStep.StepTitle + " : " + message,
                        Message: message,
                        StatusDate: new Date(Date.now()),
                        BillDigestReportable: currentTask.WorkflowStep.BillDigestReportable,
                        BillStatusReportable: currentTask.WorkflowStep.BillStatusReportable,
                        BillLookupId: bill.Id,
                        TaskLookupId: currentTask.Id,
                        Duplicate: false,
                    };
                    billDigestApi.getBillDigestForTask(currentTask)
                        .then((billDigests: IBillDigest[]) => {
                            if (billDigests.length > 0) {
                                newDigest.Message = billDigests[0].Message;
                                newDigest.VoteID = billDigests[0].VoteID;
                                newDigest.StatusDate = billDigests[0].StatusDate;
                                if (McsUtil.isNumberString(`${currentTask.WorkflowStep.CommitteeID}`)) {
                                    newDigest.AmendmentLookupId = billDigests[0].AmendmentLookupId;
                                }
                                billDigestApi.setDuplicate(billDigests[0]);
                            }
                            newDigest.Message = this._replaceToken(newDigest.Message, bill, currentTask, nextTask);
                            billDigestApi.addNewItem(newDigest).then(() => { resolve(); }, (err) => { reject(err); });
                        });
                } else {
                    resolve();
                }
            }, 1000);

        });
    }

    private _completeParentTask(bill: IBills, task: ITasks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (task.ParentLookupId > 0) {
                this._hasAllChildrenOfParentCompleted(task.ParentLookupId)
                    .then((allCompleted: boolean) => {
                        if (allCompleted) {
                            this._lmsTaskApi.getListItemById(task.ParentLookupId)
                                .then((parentTask: ITasks) => {
                                    const workflowStepService: WorkflowDefinitionService = new WorkflowDefinitionService(this.isLocalEnvironment);
                                    workflowStepService.getByStepNumber(parentTask.WorkflowStepNumber)
                                        .then((step: IWorkflowDefinition) => {
                                            parentTask.WorkflowStep = step;
                                            if (workflowStepService.hasNextSteps(step)) {
                                                workflowStepService.getNextSteps(step)
                                                    .then((nextSteps: IWorkflowDefinition[]) => {
                                                        const subTasksPromises: Array<Promise<any>> = [];
                                                        if (McsUtil.isArray(nextSteps)) {
                                                            let index: number = 0;
                                                            nextSteps.filter((f) => WorkflowLogic.IsNextStepApproved(step, f, bill))
                                                                .forEach((childStep: IWorkflowDefinition) => {
                                                                    if (index === 0) {
                                                                        // tslint:disable-next-line:max-line-length
                                                                        subTasksPromises.push(this.performTaskAction(bill, parentTask, childStep, childStep.AssignedToId, "", false, false));
                                                                    }
                                                                    index = 1;
                                                                });
                                                        }
                                                        if (subTasksPromises.length > 0) {
                                                            Promise.all(subTasksPromises).then(() => {
                                                                resolve();
                                                            });
                                                        } else {
                                                            resolve();
                                                        }
                                                    });
                                            } else {
                                                this.completeTask(bill, parentTask, null).then(() => {
                                                    resolve();
                                                });
                                            }
                                        });
                                });
                        } else {
                            resolve();
                        }
                    });
            } else {
                resolve();
            }
        });

    }

    private _createChildSteps(bill: IBills, task: ITasks): Promise<ITasks[]> {
        return new Promise<ITasks[]>((resolve, reject) => {
            const workflowStepService: WorkflowDefinitionService = new WorkflowDefinitionService(this.isLocalEnvironment);
            if (workflowStepService.hasChildSteps(task.WorkflowStep)) {
                workflowStepService.getChildSteps(task.WorkflowStep)
                    .then((childSteps: IWorkflowDefinition[]) => {
                        const childTasks: Array<Promise<ITasks>> = childSteps.filter((f) => WorkflowLogic.IsNextStepApproved(task.WorkflowStep, f, bill))
                            .map((child) => {
                                const assignedUser: IUser = McsUtil.getAssignedUser(bill, child);
                                return this._createTask(bill, task, child, McsUtil.isDefined(assignedUser) ? assignedUser.Id : 0, "", true, "");
                            });
                        Promise.all(childTasks).then((value) => {
                            resolve(value);
                        });
                    });
            } else {
                resolve([]);
            }
        });

    }

    private _createReminderTasks(bill: IBills, task: ITasks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._canSendReminderTasks(bill, task).then((canSendReminderTask) => {
                if (canSendReminderTask) {
                    const workflowStepService: WorkflowDefinitionService = new WorkflowDefinitionService(this.isLocalEnvironment);
                    workflowStepService.getReminderSteps(task.WorkflowStep)
                        .then((reminderSteps: IWorkflowDefinition[]) => {
                            const promises: Array<Promise<any>> = reminderSteps.map((step): Promise<any> => {
                                if ((WorkflowLogic.CreateBillSummary === step.Step) &&
                                    WorkflowLogic.getChamberForStep(step) === WorkflowLogic.getHouseOfOriginForBill(bill)) {
                                    return Promise.resolve();
                                } else {
                                    const assignedUser: IUser = McsUtil.getAssignedUser(bill, step);
                                    return this._createTask(bill, task, step, McsUtil.isDefined(assignedUser) ? assignedUser.Id : 0, "", false, "");
                                }
                            });
                            Promise.all(promises).then(() => {
                                resolve();
                            });
                        });
                } else {
                    resolve();
                }
            });
        });

    }

    private _getBillPropertiesToUpdate(billToUpdate: IBills, step: IWorkflowDefinition, changeDocumentStatus: boolean,
        changeDocumentVersion: boolean, publishedVersionOfBill: boolean): Promise<IBills> {
        return new Promise<IBills>((resolve, reject) => {
            const propertiesToUpdate: any = {};
            this._workFlowService.GetBillStateOnCompletion(billToUpdate, step).then((billStateOnCompletion) => {
                let needToUpdateBill: boolean = false;
                if (changeDocumentVersion) {
                    needToUpdateBill = true;
                    propertiesToUpdate.DocumentVersion = this._billsApi.getDocumentVersion(billToUpdate.DocumentVersion, publishedVersionOfBill);
                }
                if (changeDocumentStatus && McsUtil.isString(billStateOnCompletion) && billStateOnCompletion !== billToUpdate.DocumentStatus) {
                    needToUpdateBill = true;
                    propertiesToUpdate.DocumentStatus = `${billStateOnCompletion} `;
                }
                if (McsUtil.isString(step.WorkflowBillStatus) && !(/None/gi).test(step.WorkflowBillStatus) && step.WorkflowBillStatus !== billToUpdate.BillStatus) {
                    needToUpdateBill = true;
                    propertiesToUpdate.BillStatus = step.WorkflowBillStatus;
                }
                if (needToUpdateBill) {
                    resolve(propertiesToUpdate as IBills);
                } else {
                    resolve(null);
                }
            }, () => { resolve(null); });
        });
    }

    private _taskExistsForBill(bill: IBills): Promise<ITasks> {
        return new Promise<ITasks>((resolve, reject) => {
            this._lmsTaskApi.getTaskForBill(bill.Id, 0, 1)
                .then((task: ITasks[]) => {
                    if (task.length > 0) {
                        resolve(task[0]);
                    } else {
                        reject("Task not found");
                    }
                }, (err) => {
                    reject("Task not found");
                });
        });
    }

    private _canSendReminderTasks(bill: IBills, task: ITasks): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            // bill: IBills, task: ITasks
            resolve(true);
        });
    }

    private _hasAllChildrenOfParentCompleted(parentTaskId: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._lmsTaskApi.getChildrenOfParent(parentTaskId)
                .then((children: ITasks[]) => {
                    let childrenCompleted: boolean = true;
                    // tslint:disable-next-line:prefer-for-of
                    for (let i: number = 0; i < children.length; i++) {
                        if (children[i].Status !== "Completed") {
                            childrenCompleted = false;
                            break;
                        }
                    }
                    resolve(true);
                });
        });
    }

    private _createMessage(bill: IBills, task: ITasks): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // todo
            resolve();
        });
    }

}
