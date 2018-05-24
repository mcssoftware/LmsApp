import {
    IWorkflowStepActionApi,
    ILmsTaskApi,
    ITasks,
    IList,
    ILmsConfigurationApi,
    IWorkflowDefinition,
    IWorkflowDefinitionApi,
    apiHelper,
    Constants,
    WorkflowLogic,
    McsUtil,
} from "mcs-lms-core";
import { ICalendarOrder, ITaskUpdate } from "./ICalendarOrder";
import { HttpClient, IHttpClientOptions, HttpClientResponse } from "@microsoft/sp-http";
import { ODataBatch } from "sp-pnp-js";
import { ListService } from "../../services/ListService";

export class LmsCalendarService {
    private _workflowStepActionApi: IWorkflowStepActionApi;
    private _workflowDefinitionApi: IWorkflowDefinitionApi;
    private _lmsTaskApi: ILmsTaskApi;
    private _calendarOrders: ICalendarOrder[];
    public billYear: number;

    constructor(private isLocalEnvironment: boolean, private _httpClient: HttpClient, private _getToken: (context: any) => Promise<string>, private _prevContext: any) {
        this._workflowStepActionApi = apiHelper.getWorkflowStepActionApi(isLocalEnvironment);
        this._workflowDefinitionApi = apiHelper.getWorkflowDefinitionApi(isLocalEnvironment);
        this._lmsTaskApi = apiHelper.getLmsTaskApi(isLocalEnvironment);
        this._calendarOrders = [];
        apiHelper.getConfigurationApi(isLocalEnvironment).getYear().then((year) => {
            this.billYear = year;
        });
    }

    public getAllWorkflowSteps(chamber: string): Promise<IWorkflowDefinition[]> {
        const filters: string = `Chamber eq '${chamber}'`;
        return this._workflowDefinitionApi.getListItems(filters, ["StepTitle", "Id", "Step", "Chamber"], [], "StepTitle");
    }

    public getWorkflowSteps(chamber: string): Promise<ICalendarOrder[]> {
        return this.getCalendarOrders(chamber);
    }

    public getTasks(workflowSteps: ICalendarOrder[]): Promise<ITasks[]> {
        const filter: string = "Status ne 'Completed' and (" +
            workflowSteps.map((s) => `WorkflowStepNumber eq ${s.Step}`).join(" or ") + ")";
        return this._lmsTaskApi.getListItems(filter, this._lmsTaskApi.getSelects()
            .concat(["BillLookup/BillNumber", "BillLookup/CatchTitle", "BillLookup/Sponsor"]),
            this._lmsTaskApi.getExpands().concat("BillLookup"));
    }

    public getListProperties(): Promise<IList> {
        return ListService.getListProperties(this._lmsTaskApi.getWeb(), this._lmsTaskApi.listTitle);
    }

    public getCalendarOrders(chamber: string): Promise<ICalendarOrder[]> {
        return new Promise<ICalendarOrder[]>((resolve, reject) => {
            if (this._calendarOrders.length > 0) {
                resolve(this._calendarOrders);
            } else {
                this._getToken(this._prevContext).then((token) => {
                    this._httpClient.get(Constants.ServiceUrl.CalendarOrder, HttpClient.configurations.v1,
                        this._getHttpOption(token)).then((response: HttpClientResponse) => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                reject(response.statusText);
                            }
                        })
                        .then((result: ICalendarOrder[]) => {
                            if (McsUtil.isArray(result) && result.length > 0) {
                                this._calendarOrders = result;
                                resolve(result);
                            } else {
                                this._calendarOrders = (chamber === "House") ? this._getHouseSteps(this.billYear) : this._getSenateSteps(this.billYear);
                                resolve(this._calendarOrders);
                            }

                        }, (error) => {
                            reject(error);
                        });
                });
            }
        });
    }

    public add(properties: ICalendarOrder): ICalendarOrder {
        properties.SortIndex = this._calendarOrders[this._calendarOrders.length - 1].SortIndex + 1;
        this._calendarOrders.push(properties);
        return properties;
    }

    public delete(data: ICalendarOrder): void {
        this._calendarOrders.splice(this._calendarOrders.indexOf(data), 1);
    }

    public saveChanges(sectionToSave: ICalendarOrder[], itemsToSave: ITaskUpdate[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this._getToken(this._prevContext).then((token) => {
                this._httpClient.post(Constants.ServiceUrl.CalendarOrder, HttpClient.configurations.v1,
                    this._getHttpOption(token, sectionToSave)).then((response: HttpClientResponse) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            return Promise.resolve(null);
                        }
                    }, (error) => {
                        reject(error);
                    }).then(() => {
                        if (itemsToSave.length > 0) {
                            const batch: ODataBatch = this._lmsTaskApi.getBatch();
                            itemsToSave.forEach((item) => {
                                this._lmsTaskApi.updateItemInBatch(batch, item.Id, item.EntityType, item.properties);
                            });
                            return batch.execute();
                        } else {
                            return Promise.resolve();
                        }
                    }).then(() => {
                        resolve();
                    });
            }, (error) => { reject(error); });
        });
    }

    private _getHouseSteps(billYear: number): ICalendarOrder[] {
        const workflowSteps: ICalendarOrder[] = [];
        let sortIndex: number = 1;
        if (billYear % 2 === 0) {
            workflowSteps.push({
                Step: WorkflowLogic.HouseReceivedForIntroduction,
                Name: "Introduction Votes",
                IsConsent: false,
                Chamber: "House",
                SortIndex: sortIndex++,
                UserDefined: false,
                Modified: new Date(Date.now()),
            });
        }
        workflowSteps.push({
            Step: WorkflowLogic.HouseSecondReading,
            Name: "Second Reading",
            IsConsent: false,
            Chamber: "House",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        workflowSteps.push({
            Step: WorkflowLogic.HouseThirdReading,
            Name: "Third Reading",
            IsConsent: false,
            Chamber: "House",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        workflowSteps.push({
            Step: WorkflowLogic.HouseThirdReading,
            Name: "Third Reading Consent List",
            IsConsent: true,
            Chamber: "House",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        workflowSteps.push({
            Step: WorkflowLogic.HouseGeneralFile,
            Name: "General File",
            IsConsent: false,
            Chamber: "House",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        return workflowSteps;
    }

    private _getSenateSteps(billYear: number): ICalendarOrder[] {
        const workflowSteps: ICalendarOrder[] = [];
        let sortIndex: number = 1;
        if (billYear % 2 === 0) {
            workflowSteps.push({
                Step: WorkflowLogic.HouseReceivedForIntroduction,
                Name: "Introduction Votes",
                IsConsent: false,
                Chamber: "Senate",
                SortIndex: sortIndex++,
                UserDefined: false,
                Modified: new Date(Date.now()),
            });
        }
        workflowSteps.push({
            Step: WorkflowLogic.HouseSecondReading,
            Name: "Second Reading",
            IsConsent: false,
            Chamber: "Senate",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        workflowSteps.push({
            Step: WorkflowLogic.HouseThirdReading,
            Name: "Third Reading",
            IsConsent: false,
            Chamber: "Senate",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        workflowSteps.push({
            Step: WorkflowLogic.HouseThirdReading,
            Name: "Third Reading Consent List",
            IsConsent: true,
            Chamber: "Senate",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        workflowSteps.push({
            Step: WorkflowLogic.HouseGeneralFile,
            Name: "General File",
            IsConsent: false,
            Chamber: "Senate",
            SortIndex: sortIndex++,
            UserDefined: false,
            Modified: new Date(Date.now()),
        });
        return workflowSteps;
    }

    private _unique<T>(arr: T[], prop: string): T[] {
        const hash: any = {};
        const result: T[] = [];
        for (let i: number = 0, l: number = arr.length; i < l; ++i) {
            if (typeof prop === "undefined" || !arr[i].hasOwnProperty(prop)) {
                if (!hash.hasOwnProperty(arr[i])) { // it works with objects! in FF, at least
                    hash[arr[i]] = true;
                    result.push(arr[i]);
                }
            } else {
                if (!hash.hasOwnProperty(arr[i][prop])) { // it works with objects! in FF, at least
                    hash[arr[i][prop]] = true;
                    result.push(arr[i]);
                }
            }
        }
        return result;
    }

    private _getHttpOption(token: string, content?: any): IHttpClientOptions {
        const requestHeader: any = {
            "Content-type": "application/json",
            "Cache-Control": "no-cache",
            "Authorization": "Bearer " + token,
        };
        const httpClientOption: IHttpClientOptions = { headers: requestHeader };
        if (McsUtil.isDefined(content)) {
            httpClientOption.body = JSON.stringify(content);
        }
        return httpClientOption;
    }
}