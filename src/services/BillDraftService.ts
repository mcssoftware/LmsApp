import { clone } from "@microsoft/sp-lodash-subset";
import { HttpClient } from "@microsoft/sp-http";
import { IListApi, IBillDraftRequest, apiHelper, IBills, Constants, LmsFormatters, ILmsConfigurationApi, ITasks, McsUtil } from "mcs-lms-core";
import { BillsService } from "./BillsService";
import { SequenceNumbersService } from "./SequenceNumbersService";
import { TasksServices } from "./TasksService";

export class BillDraftService {
    private _billDraftApi: IListApi<IBillDraftRequest>;

    constructor(private isLocalEnvironment: boolean) {
        this._billDraftApi = apiHelper.getBillDraftApi(isLocalEnvironment);
    }

    public getBillDraftById(id: number): Promise<IBillDraftRequest> {
        return this._billDraftApi.getListItemById(id);
    }

    public getBillDraftByLsoNumber(lsonumber: string): Promise<IBillDraftRequest> {
        return new Promise<IBillDraftRequest>((resolve, reject) => {
            this._billDraftApi.getListItems(`LSONumber eq '${lsonumber}'`)
                .then((response) => {
                    if (response.length > 0) {
                        resolve(response[0]);
                    }
                }, (err) => { reject(err); });
        });
    }

    public getBill(lsonumber: string): Promise<IBills> {
        const billService: BillsService = new BillsService(this.isLocalEnvironment);
        return billService.getBill(lsonumber);
    }

    public save(httpClient: HttpClient, accessToken: string, item: IBillDraftRequest, allowCreateBill: boolean): Promise<IBillDraftRequest> {
        return new Promise<IBillDraftRequest>((resolve, reject) => {
            if (item.Id > 0) {
                const newObject: IBillDraftRequest = {
                    Title: item.Title,
                    LSONumber: item.LSONumber,
                    BillDisclosed: item.BillDisclosed,
                    CatchTitle: item.CatchTitle,
                    CoSponsor: item.CoSponsor,
                    CoSponsorType: item.CoSponsorType,
                    ContactPerson: item.ContactPerson,
                    DateReceived: item.DateReceived,
                    DrafterId: item.DrafterId,
                    DraftReceivedBy: item.DraftReceivedBy,
                    DraftingInstructions: item.DraftingInstructions,
                    HasFiscalImpact: item.HasFiscalImpact,
                    HouseofOrigin: item.HouseofOrigin,
                    InfoReceivedMethod: item.InfoReceivedMethod,
                    LSOResearchRequestNumber: item.LSOResearchRequestNumber,
                    LegislationType: item.LegislationType,
                    PrimeSponsorshipClause: item.PrimeSponsorshipClause,
                    ReleaseBill: item.ReleaseBill,
                    Requestor: item.Requestor,
                    RequestorType: item.RequestorType,
                    Sponsor: item.Sponsor,
                    SponsorTitle: item.SponsorTitle,
                    SponsorType: item.SponsorType,
                    SponsorshipClause: item.SponsorshipClause,
                };
                this._billDraftApi.updateItem(item.Id, item["odata.type"], newObject).then(() => {
                    this._billDraftApi.getListItemById(item.Id).then((bdr) => {
                        this._ensureBillAndTaskIsCreate(httpClient, accessToken, bdr, allowCreateBill)
                            .then(() => {
                                resolve(bdr);
                            }, () => { resolve(bdr); });
                    });
                });
            } else {
                item.Title = item.LSONumber = "TEMPLSO" + (new Date()).format("yyyyMMddhhmmss");
                this._billDraftApi.addNewItem(item).then((result) => {
                    item = result as IBillDraftRequest;
                    this._getLsoNumber("")
                        .then((lsonumber: string) => {
                            item.LSONumber = lsonumber;
                            item.Title = lsonumber;
                            this._billDraftApi.updateItem(item.Id, item["odata.type"], { LSONumber: lsonumber, Title: lsonumber });
                            // create or update bill draft
                            this._ensureBillAndTaskIsCreate(httpClient, accessToken, item, allowCreateBill)
                                .then(() => {
                                    resolve(item);
                                }, () => {
                                    resolve(item);
                                });
                        });
                }, (err) => {
                    reject(McsUtil.getApiErrorMessage(err));
                });
            }
        });
    }

    private _getLsoNumber(lsonumber: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (McsUtil.isString(lsonumber)) {
                resolve(lsonumber);
            } else {
                const serviceApiService: SequenceNumbersService = new SequenceNumbersService(this.isLocalEnvironment);
                serviceApiService.getNextSequenceNumber(Constants.SequenceNumberType.LsoNumber)
                    .then((nextNumber: number) => {
                        LmsFormatters.LsoOrBillNumber(nextNumber.toString(), apiHelper.getConfigurationApi(this.isLocalEnvironment))
                            .then((formatterLsoNumber: string) => {
                                resolve(formatterLsoNumber);
                            });
                    });
            }
        });
    }

    private _ensureBillAndTaskIsCreate(httpClient: HttpClient, token: string, bdr: IBillDraftRequest, allowCreateBill: boolean): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const lmsConfiguration: ILmsConfigurationApi = apiHelper.getConfigurationApi(this.isLocalEnvironment);
            lmsConfiguration.getConfiguration().then((config) => {
                const billService: BillsService = new BillsService(this.isLocalEnvironment);
                billService.createOrUpdateBill(httpClient, bdr, config.BillYear, token, allowCreateBill)
                    .then((bill: IBills) => {
                        const taskService: TasksServices = new TasksServices(this.isLocalEnvironment);
                        taskService.ensureSeedTask(bill, bdr.DraftingInstructions)
                            .then((task: ITasks) => {
                                resolve({ Bill: bill, Task: task });
                            }, (err) => { reject(err); });
                    }, (err) => { reject(err); });
            });

        });
    }

    public static getDefaultValue(id: number): IBillDraftRequest {
        return {
            Id: id,
            Title: "",
            LSONumber: "",
            BillDisclosed: "Unknown",
            CatchTitle: "",
            CoSponsor: "",
            CoSponsorType: "",
            ContactPerson: "",
            DrafterId: undefined,
            DateReceived: new Date(),
            DraftReceivedBy: "",
            DraftingInstructions: "",
            HasFiscalImpact: "Unknown",
            HouseofOrigin: "Senate",
            InfoReceivedMethod: "Phone",
            LSOResearchRequestNumber: "",
            LegislationType: "Bill",
            PrimeSponsorshipClause: "",
            ReleaseBill: "None",
            Requestor: "",
            RequestorType: "",
            Sponsor: "",
            SponsorTitle: "",
            SponsorType: "",
            SponsorshipClause: "",
        };
    }
}
