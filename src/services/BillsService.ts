// tslint:disable:object-literal-key-quotes
import { IBillApi, apiHelper, IBills, McsUtil, IBillDraftRequest, IContentType, Constants, config } from "mcs-lms-core";
import { HttpClient, IHttpClientOptions, HttpClientResponse } from "@microsoft/sp-http";
import { ListService } from "./ListService";

export class BillsService {
    private _billsApi: IBillApi;

    constructor(private isLocalEnvironment: boolean) {
        this._billsApi = apiHelper.getBillsApi(isLocalEnvironment);
    }

    public getBill(identifier: number | string): Promise<IBills> {
        return new Promise<IBills>((resolve, reject) => {
            if (McsUtil.isDefined(identifier)) {
                if (McsUtil.isString(identifier)) {
                    this._billsApi.getBill(identifier as string)
                        .then((value) => {
                            resolve(value);
                        }, (err) => { reject(err); });
                } else {
                    this._billsApi.getListItemById(identifier as number)
                        .then((value) => {
                            resolve(value);
                        }, (err) => { reject(err); });
                }
            } else {
                reject("Bill number cannot be empty.");
            }
        });
    }

    public getBills(filter?: string, select?: string[], orderBy?: string, ascending?: boolean, skip?: number, top?: number): Promise<IBills[]> {
        return this._billsApi.getListItems(filter, select, [], orderBy, ascending, skip, top);
    }

    public createOrUpdateBill(httpClient: HttpClient, bdr: IBillDraftRequest, billyear: string, accessToken: string, allowCreateBill: boolean): Promise<IBills> {
        return new Promise<IBills>((resolve, reject) => {
            // check if bill exists
            this._billsApi.getBill(bdr.LSONumber)
                .then((bill: IBills) => {
                    if (allowCreateBill && bill.LegislationType !== bdr.LegislationType) {
                        // recreate bill
                        this._getBillBlob(httpClient, bdr, accessToken).then((blob) => {
                            this._billsApi.updateBill(bill, this.updateProperties(bill, bdr, billyear, false), blob, "Bill recreated by changing bill type.", false)
                                .then((updatedBill: IBills) => {
                                    resolve(updatedBill);
                                }, (err) => { reject(err); });
                        }, (err) => { reject(err); });
                    } else {
                        // bill found, update properties.
                        this._billsApi.updateBillNoBlob(bill, this.updateProperties(bill, bdr, billyear, true), "Bill Draft request updated", false)
                            .then((updatedBill: IBills) => {
                                resolve(updatedBill);
                            }, (err) => { reject(err); });
                    }
                }, () => {
                    if (bdr.DrafterId > 0) {
                        this._getBillBlob(httpClient, bdr, accessToken).then((blob) => {
                            if (McsUtil.isDefined(blob)) {
                                this._billsApi.createBill(this.updateProperties({} as IBills, bdr, billyear, false), blob)
                                    .then((newBill: IBills) => {
                                        resolve(newBill);
                                    }, (err) => {
                                        reject(err);
                                    });
                            }
                        }, (err) => { reject(err); });
                    } else {
                        resolve(null);
                    }
                });
        });
    }

    /**
     * Update bill with new properties and new content
     * @param {IBills} bill
     * @param {IBills} propertiesToUpdate
     * @param {Blob} blob
     * @returns {Promise<IBills>}
     * @memberof BillsService
     */
    public updateBillDocument(bill: IBills, propertiesToUpdate: IBills, blob: Blob, checkInComments: string, publish: boolean): Promise<IBills> {
        return this._billsApi.updateBill(bill, propertiesToUpdate, blob, checkInComments, publish);
    }

    public updateProperties(bill: IBills, bdr: IBillDraftRequest, billYear: string, updatingExitingBill: boolean): IBills {
        bill.Title = bdr.LSONumber;
        bill.CatchTitle = bdr.CatchTitle;
        bill.ContactPerson = bdr.ContactPerson;
        bill.CoSponsor = bdr.CoSponsor;
        bill.DateReceived = bdr.DateReceived;
        let oldDrafterValue: number = 0;
        if (updatingExitingBill && bill.DrafterId > 0) {
            oldDrafterValue = bill.DrafterId;
        }
        bill.DrafterId = bdr.DrafterId;
        let needToUpdateDrafterTask: boolean = false;
        if (oldDrafterValue !== bill.DrafterId && !updatingExitingBill) {
            needToUpdateDrafterTask = true;
        }
        bill.HasFiscalImpact = bdr.HasFiscalImpact;
        bill.HouseofOrigin = bdr.HouseofOrigin;
        bill.LegislationType = bdr.LegislationType;
        bill.LSONumber = bdr.LSONumber;
        bill.Requestor = bdr.Requestor;
        bill.RevenueRaising = bdr.RevenueRaising;
        bill.RevenueRaisingDate = bdr.RevenueRaisingDate;
        bill.Sponsor = bdr.Sponsor;
        bill.SponsorTitle = bdr.SponsorTitle;
        bill.ReleaseBill = bdr.ReleaseBill;
        if (McsUtil.isString(bill.BillNumber)) {
            bill.SponsorshipClause = bdr.PrimeSponsorshipClause;
        } else {
            bill.SponsorshipClause = bdr.SponsorshipClause;
        }
        if (McsUtil.isString(bdr.HouseofOrigin)) {
            bill.BillType = bdr.HouseofOrigin.toUpperCase() === "SENATE" ? "SENATE FILE" : "HOUSE BILL";
        }
        const documentStatus: string = "Working Draft";
        if (updatingExitingBill) {
            if (McsUtil.isString(bill.DocumentStatus)) {
                if (bill.DocumentStatus.toLowerCase().indexOf("formal draft") >= 0) {
                    const sponsorType: string = bdr.SponsorType;
                    if (McsUtil.isString(sponsorType)) {
                        if (sponsorType.toUpperCase() === "COMMITTEE") {
                            bill.DocumentStatus = "Committee Formal Draft";
                        } else {
                            bill.DocumentStatus = "Legislator Formal Draft";
                        }
                    }
                }
            } else {
                bill.DocumentStatus = documentStatus;
            }
        } else {
            bill.DocumentStatus = documentStatus;
            bill.BillYear = billYear;
        }
        if (!updatingExitingBill && bill.LegislationType !== bdr.LegislationType) {
            if (bdr.LegislationType === "Bill") {
                bill.BillTitle = "AN ACT relating to ; and providing for an effective date.";
            } else {
                if (bdr.LegislationType === "Congressional Resolution") {
                    bill.BillTitle = "A JOINT RESOLUTION requesting Congress to ";
                } else {
                    bill.BillTitle = "A JOINT RESOLUTION ";
                }
            }
        }
        if (!McsUtil.isString(bill.BillStatus)) {
            bill.BillStatus = "Drafting";
        }
        return bill;
    }

    public checkInBill(bill: IBills, comment: string, publish: boolean): Promise<IBills> {
        return this._billsApi.checkInBill(bill, comment, publish);
    }

    private _getBillBlob(httpClient: HttpClient, bdr: IBillDraftRequest, accessToken?: string): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            Promise.all([ListService.getListProperties(this._billsApi.getWeb(), this._billsApi.listTitle),
            ListService.getListContentType(this._billsApi.getWeb(), this._billsApi.listTitle)])
                .then(([billProperty, contentType]) => {
                    let contentTypeFilter: IContentType[] = contentType.filter((f) => f.Name === bdr.LegislationType);
                    if (contentTypeFilter.length < 1) {
                        contentTypeFilter = contentType.filter((f) => f.Name === "Bill");
                    }
                    let url: string = `${Constants.ServiceUrl.CreateBill}?webUrl=${config.getLmsUrl()}` +
                        `&listId=${billProperty.Id}&templateUrl=${contentTypeFilter[0].DocumentTemplateUrl}`;
                    if (McsUtil.isNumeric(bdr.ResurrectBillYear) && McsUtil.isString(bdr.ResurrectLsoNumber) && McsUtil.isString(bdr.ResurrectBillVersion)) {
                        url += `&resurrectYear=${bdr.ResurrectBillYear}&resurrectLsonumber=${bdr.ResurrectLsoNumber}&resurrectVersion=${bdr.ResurrectBillVersion}`;
                    }
                    // create bill
                    const requestHeaders: Headers = new Headers();
                    // requestHeaders.append("Accept", "application/json");
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
                                resolve(billBlob);
                            }
                        });
                }, (err) => { reject(err); });

        });
    }
}
