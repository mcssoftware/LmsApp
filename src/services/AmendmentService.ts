import {
    IAmendmentApi, IAmendments, IBills, ILegislator, ICommittee,
    ILmsTaskApi,
    McsUtil,
    Constants,
    apiHelper,
    WorkflowLogic,
    config,
    lmsLogger,
} from "mcs-lms-core";
import { HttpClient, IHttpClientOptions, HttpClientResponse } from "@microsoft/sp-http";
import { SponsorService } from "./SponsorService";
import { ListService } from "./ListService";

export class AmendmentService {
    private _amendmentApi: IAmendmentApi;

    public static proposedStatus: string = "PROPOSED";
    public static numberedStatus: string = "NUMBERED";
    public static approvedForDistributionStatus: string = "APPROVED FOR DISTRIBUTION";
    public static splitStatus: string = "SPLIT";

    constructor(private isLocalEnvironment: boolean) {
        this._amendmentApi = apiHelper.getAmendmentApi(this.isLocalEnvironment);
    }

    public getAmendmentById(id: number): Promise<IAmendments> {
        return this._amendmentApi.getListItemById(id);
    }

    public getResurrectAmendments(): Promise<IAmendments[]> {
        return this._amendmentApi.getListItems("AmendmentStatus ne 'SPLIT'", ["Id", "AmendmentNumber"], []);
    }

    public getAmendmentsForBill(bill: IBills): Promise<IAmendments[]> {
        return new Promise((resolve, reject) => {
            if (McsUtil.isDefined(bill)) {
                this._amendmentApi.getAmendmentsForBill(bill.Id).then((results: IAmendments[]) => {
                    resolve(results);
                }, (err) => {
                    reject(err);
                });
            } else {
                reject("Bill is required.");
            }
        });
    }

    public isBillEngrossed(bill: IBills): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const lmsTaskApi: ILmsTaskApi = apiHelper.getLmsTaskApi(this.isLocalEnvironment);
            lmsTaskApi.getListItems(`BillLookupId eq ${bill.Id} and WorkflowStepNumber eq ${WorkflowLogic.EngrossingAfterChamber} and ` +
                `WorkflowStepNumber eq ${WorkflowLogic.EngrossingBetweenChamber} and Status eq 'Completed'`, ["Id"], [], null, false, 0, 1)
                .then((result) => {
                    if (result.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }, () => {
                    resolve(false);
                });
        });
    }

    public getProposedAmendmentNumber(bill: IBills, sponsorType: Constants.SponsorType, sponsor: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (McsUtil.isString(bill.BillNumber)) {
                const sponsorService: SponsorService = new SponsorService(false);
                sponsorService.getSelectedSponsor(sponsorType, sponsor).then((value) => {
                    let sponsorNumber: string = "";
                    let chamber: string = "";
                    let sponsorTitle: string = "";
                    if (sponsorType === Constants.SponsorType.Legislator) {
                        const legislator: ILegislator = value as ILegislator;
                        chamber = legislator.Chamber[0].toUpperCase();
                        sponsorTitle = legislator.LegislatureDisplayName;
                        if (legislator.LegislatorID.length > 1) {
                            sponsorNumber = legislator.LegislatorID;
                        } else {
                            sponsorNumber = "0" + legislator.LegislatorID;
                        }
                    }
                    if (sponsorType === Constants.SponsorType.Committee) {
                        const committee: ICommittee = value as ICommittee;
                        sponsorNumber = committee.CommitteeShortName[0] + "C" + committee.CommitteeShortName.substring(1);
                        sponsorTitle = committee.Title;
                    }
                    const proposedAmendmentFilter: string = `BillLookupId  eq ${bill.Id} and `
                        + `(Sponsor eq '${encodeURIComponent(sponsorTitle)}' or substringof('${bill.BillNumber}${chamber}${sponsorNumber}',Title))`;
                    const splitAmendmentFilter: string = `BillLookupId eq ${bill.Id} and Sponsor eq '${encodeURIComponent(sponsorTitle)}' and AmendmentNumber eq '.'`;
                    Promise.all([this._amendmentApi.getListItemsCount(proposedAmendmentFilter), this._amendmentApi.getListItemsCount(splitAmendmentFilter)])
                        .then((response) => {
                            let proposedCount: number = response[0] - response[1];
                            if (proposedCount < 0) {
                                proposedCount = 0;
                            }
                            resolve(`PROP${bill.BillNumber}${chamber}${sponsorNumber}${McsUtil.padNumber(proposedCount + 1, 2)}`.toUpperCase());
                        }, (err) => { reject(err); });
                });
            } else {
                resolve("");
            }
        });
    }

    public getProposedJccAmendmentNumber(bill: IBills): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this._amendmentApi.getListItemsCount(`substringof('${bill.BillNumber}JC',AmendmentNumber)`)
                .then((jccCount: number) => {
                    resolve(`PROP${bill.BillNumber}JCC${McsUtil.padNumber(jccCount, 2)}`);
                });
        });
    }

    public getAmendmentNumber(bill: IBills, house: string, orderOfBusiness: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (orderOfBusiness.toUpperCase() === "JC") {
                house = "";
            }
            const partialAmendmentNumber: string = `${bill.BillNumber}${house}${orderOfBusiness}`;
            const amendmentFilter: string = `BillLookupId eq ${bill.Id} and startswith(AmendmentNumber,'${partialAmendmentNumber}')`;
            const splitAmendmentFilter: string = `BillLookupId eq ${bill.Id} and` +
                ` startswith(AmendmentNumber,'${partialAmendmentNumber}') and substringof('.',AmendmentNumber)')`;
            Promise.all([this._amendmentApi.getListItemsCount(amendmentFilter), this._amendmentApi.getListItemsCount(splitAmendmentFilter)])
                .then((response) => {
                    resolve(`${partialAmendmentNumber}${McsUtil.padNumber(response[0] + 1 - response[1], 3)}`.toUpperCase());
                }, (err) => { reject(err); });
        });
    }

    public createAmendment(httpClient: HttpClient, amendmentProps: IAmendments, isHouseAmendment: boolean, isCommitteeAmendment: boolean,
        isBillEngrossed: boolean, billSubstituteNumber: number, resurrectAmendmentUrl: string, isNumberedResurrect: boolean, accessToken?: string): Promise<IAmendments> {
        return new Promise<IAmendments>((resolve, reject) => {
            lmsLogger.writeInfo("Getting amendment list properties.");
            ListService.getListProperties(this._amendmentApi.getWeb(), this._amendmentApi.listTitle)
                .then((listProperty) => {
                    const url: string = `${Constants.ServiceUrl.CreateAmendment}?webUrl=${config.getSiteUrl()}&listId=${listProperty.Id}` +
                        `&templateUrl=${Constants.LmsTemplates.ProposedAmendmentTemplateUrl}&isHouseAmendment=${isHouseAmendment}` +
                        `&isCommitteeSponsor=${isCommitteeAmendment}&isBillEngrossed=${isBillEngrossed}&billSubstitudeNumber=${billSubstituteNumber}` +
                        `&resurrectUrl=${resurrectAmendmentUrl}&isNumberedResurrect=${isNumberedResurrect}`;
                    const requestHeaders: Headers = new Headers();
                    requestHeaders.append("Content-type", "application/json");
                    requestHeaders.append("Cache-Control", "no-cache");
                    requestHeaders.append("Authorization", "Bearer " + accessToken);

                    const httpClientOptions: IHttpClientOptions = {
                        headers: requestHeaders,
                    };
                    lmsLogger.writeInfo("Calling web service to genarate amendment.");
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
                        .then((amendmentBlob: Blob) => {
                            if (McsUtil.isDefined(amendmentBlob)) {
                                lmsLogger.writeInfo("Uploading amendment to SharePoint library.");
                                amendmentProps.Title = `${amendmentProps.AmendmentNumber}`;
                                amendmentProps.AmendmentStatus = AmendmentService.proposedStatus;
                                this._amendmentApi.updateAmendment(amendmentProps.AmendmentNumber + ".docx", amendmentProps, amendmentBlob)
                                    .then((newAmendment) => {
                                        resolve(newAmendment);
                                    }, (err) => { resolve(err); });
                            }
                        });

                }, (err) => { reject(err); });
        });
    }

    public createJccAmendment(httpClient: HttpClient, bill: IBills, currentUserId: number,
        houseOfOriginAdopted: any[], oppositeChamberAdopted: any[], accessToken?: string): Promise<IAmendments> {
        return new Promise<IAmendments>((resolve, reject) => {
            lmsLogger.writeInfo("Getting amendment list properties.");
            ListService.getListProperties(this._amendmentApi.getWeb(), this._amendmentApi.listTitle)
                .then((listProperty) => {
                    const url: string = `${Constants.ServiceUrl.CreateAmendment}`;
                    const requestHeaders: Headers = new Headers();
                    requestHeaders.append("Content-type", "application/json");
                    requestHeaders.append("Cache-Control", "no-cache");
                    requestHeaders.append("Authorization", "Bearer " + accessToken);

                    const body: any = {
                        WebUrl: config.getLmsUrl(),
                        ListId: listProperty.Id,
                        TemplateUrl: Constants.LmsTemplates.JccTemplateUrl,
                        IsBudgetBill: WorkflowLogic.IsBudgetBill(bill),
                        BillHouseOfOrigin: bill.HouseofOrigin,
                        HouseOfOriginAdoptedAmendment: houseOfOriginAdopted,
                        OppositeChamberAdoptedAmendment: oppositeChamberAdopted,
                    };
                    const httpClientOptions: IHttpClientOptions = {
                        headers: requestHeaders,
                        body: JSON.stringify(body),
                    };
                    lmsLogger.writeInfo("Calling web service to genarate amendment.");
                    httpClient.post(url, HttpClient.configurations.v1, httpClientOptions)
                        .then((response: HttpClientResponse) => {
                            if (response.ok) {
                                return response.blob();
                            } else {
                                reject(response.statusText);
                            }
                        }, (err) => {
                            reject(err);
                        })
                        .then((amendmentBlob: Blob) => {
                            if (McsUtil.isDefined(amendmentBlob)) {
                                this.getProposedJccAmendmentNumber(bill)
                                    .then((jccNumber: string) => {
                                        lmsLogger.writeInfo("Uploading amendment to SharePoint library.");
                                        const amendmentProps: IAmendments = {
                                            Title: jccNumber,
                                            AmendmentNumber: jccNumber,
                                            AmendmentStatus: "PROPOSED",
                                            AppliedToEngrossed: true,
                                            BillLookupId: bill.Id,
                                            DrafterId: currentUserId,
                                            IsCorrectedCopy: false,
                                            IsCorrectedToCorrectedCopy: false,
                                            IsDividedAmendment: false,
                                            ProposedAmendmentNumber: jccNumber,
                                            Requestor: "",
                                            RequestorType: "",
                                            ResurrectRelatedAmendments: "",
                                            Sponsor: "",
                                            SponsorType: "",
                                        };
                                        this._amendmentApi.updateAmendment(amendmentProps.AmendmentNumber + ".docx", amendmentProps, amendmentBlob)
                                            .then((newAmendment) => {
                                                resolve(newAmendment);
                                            }, (err) => { resolve(err); });
                                    });
                            }
                        });

                }, (err) => { reject(err); });
        });
    }

    public createNumberedAmendment(httpClient: HttpClient, amendmentToUpdate: IAmendments, newProperties: IAmendments,
        bill: IBills, house: string, orderOfBusiness: string, accessToken: string): Promise<IAmendments> {
        return new Promise<IAmendments>((resolve, reject) => {
            if (McsUtil.isString(newProperties.AmendmentNumber)) {
                ListService.getListProperties(this._amendmentApi.getWeb(), this._amendmentApi.listTitle)
                    .then((listProperty) => {
                        const url: string = `${Constants.ServiceUrl.ConvertToNumberedAmendment}?webUrl=${config.getLmsUrl()}` +
                            `&amendmentUrl=${amendmentToUpdate.File.ServerRelativeUrl}` +
                            `&isBillEngrossed=${newProperties.AppliedToEngrossed}` +
                            `&isDividedAmendment=${newProperties.IsDividedAmendment}` +
                            `&isCorrectedCopy=${newProperties.IsCorrectedCopy}` +
                            `&isCorrectedCorrectedCopy=${newProperties.IsCorrectedToCorrectedCopy}`;
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
                            .then((amendmentBlob: Blob) => {
                                if (McsUtil.isDefined(amendmentBlob)) {
                                    // tslint:disable-next-line:no-string-literal
                                    newProperties["FileLeafRef"] = `${newProperties.AmendmentNumber}.docx`;
                                    newProperties.Title = `${amendmentToUpdate.AmendmentNumber}-${newProperties.AmendmentNumber}`;
                                    newProperties.AmendmentStatus = AmendmentService.numberedStatus;
                                    newProperties.AmendmentNumber = newProperties.AmendmentNumber;
                                    this._amendmentApi.updateAmendment(amendmentToUpdate.File.Name, newProperties, amendmentBlob).
                                        then((newAmendment) => {
                                            resolve(newAmendment);
                                        }, (err) => { reject(err); });
                                }
                            });

                    }, (err) => { reject(err); });
            } else {
                reject("Offered number is required");
            }
        });
    }

    public approveForDistribution(amendment: IAmendments): Promise<IAmendments> {
        return new Promise<IAmendments>((resolve, reject) => {
            if (!(/distribution/gi.test(amendment.AmendmentStatus))) {
                this._amendmentApi.updateAmendmentStatus(amendment, AmendmentService.approvedForDistributionStatus, "")
                    .then(() => {
                        amendment.AmendmentStatus = AmendmentService.approvedForDistributionStatus;
                        resolve(amendment);
                    }, (err) => { reject(err); });
            } else {
                resolve();
            }
        });
    }

    public saveAmendment(httpClient: HttpClient, amendmentToUpdate: IAmendments, newProperties: IAmendments, accessToken: string): Promise<IAmendments> {
        return new Promise<IAmendments>((resolve, reject) => {
            if (amendmentToUpdate.AmendmentNumber === newProperties.AmendmentNumber
                && amendmentToUpdate.AmendmentStatus === newProperties.AmendmentStatus) {
                ListService.getListProperties(this._amendmentApi.getWeb(), this._amendmentApi.listTitle)
                    .then((listProperty) => {
                        const url: string = `${Constants.ServiceUrl.UpdateAmendment}?webUrl=${config.getLmsUrl()}` +
                            `&amendmentUrl=${amendmentToUpdate.File.ServerRelativeUrl}` +
                            `&isBillEngrossed=${newProperties.AppliedToEngrossed}` +
                            `&isDividedAmendment=false` +
                            `&isCorrectedCopy=${newProperties.IsCorrectedCopy}` +
                            `&isCorrectedCorrectedCopy=${newProperties.IsCorrectedToCorrectedCopy}`;
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
                            .then((amendmentBlob: Blob) => {
                                if (McsUtil.isDefined(amendmentBlob)) {
                                    this._amendmentApi.updateAmendment(amendmentToUpdate.File.Name, newProperties, amendmentBlob).
                                        then((newAmendment) => {
                                            resolve(newAmendment);
                                        }, (err) => { reject(err); });
                                }
                            });
                    }, (err) => { reject(err); });
            } else {
                reject();
            }
        });
    }

    public splitAmendment(httpClient: HttpClient, amendmentToSplit: IAmendments, numberOfSplit: number, accessToken: string): Promise<IAmendments[]> {
        return new Promise<IAmendments[]>((resolve, reject) => {
            if (numberOfSplit > 0) {
                ListService.getListProperties(this._amendmentApi.getWeb(), this._amendmentApi.listTitle)
                    .then((listProperty) => {
                        const url: string = `${Constants.ServiceUrl.SplitAmendment}?webUrl=${config.getLmsUrl()}` +
                            `&amendmentUrl=${amendmentToSplit.File.ServerRelativeUrl}` +
                            `&isBillEngrossed=${amendmentToSplit.AppliedToEngrossed}`;
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
                            .then((amendmentBlob: Blob) => {
                                if (McsUtil.isDefined(amendmentBlob)) {
                                    const promises: Array<Promise<IAmendments>> = [];
                                    for (let i: number = 0; i < numberOfSplit; i++) {
                                        const splitProperties: IAmendments = {
                                            AmendmentNumber: amendmentToSplit.AmendmentNumber + "." + McsUtil.padNumber(i, 2),
                                            AmendmentStatus: AmendmentService.numberedStatus,
                                            DrafterId: amendmentToSplit.DrafterId,
                                            BillLookupId: amendmentToSplit.BillLookupId,
                                            Requestor: amendmentToSplit.Requestor,
                                            RequestorType: amendmentToSplit.RequestorType,
                                            ResurrectRelatedAmendments: amendmentToSplit.ResurrectRelatedAmendments,
                                            Sponsor: amendmentToSplit.Sponsor,
                                            SponsorType: amendmentToSplit.SponsorType,
                                            CoSponsor: amendmentToSplit.CoSponsor,
                                            PostedAction: "",
                                            AppliedToEngrossed: amendmentToSplit.AppliedToEngrossed,
                                            IsCorrectedCopy: true,
                                            IsCorrectedToCorrectedCopy: false,
                                            IsDividedAmendment: true,
                                            ProposedAmendmentNumber: amendmentToSplit.ProposedAmendmentNumber,
                                            Title: amendmentToSplit.AmendmentNumber + "." + McsUtil.padNumber(i, 2),
                                        };
                                        promises.push(this._amendmentApi.updateAmendment(splitProperties.Title + ".docx", splitProperties, amendmentBlob));
                                    }
                                    this._amendmentApi.updateAmendmentStatus(amendmentToSplit, AmendmentService.splitStatus, "");
                                    Promise.all(promises)
                                        .then((responses) => {
                                            resolve(responses);
                                        }, (err) => { reject(err); });
                                }
                            });
                    }, (err) => { reject(err); });
            } else {
                reject("Invalid number of splits.");
            }
        });
    }

}