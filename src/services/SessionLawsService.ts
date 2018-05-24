import {
    ITasks, IBills, IBillApi, ISessionLaws, ISessionLawsApi,
    apiHelper, Constants, config, McsUtil,
} from "mcs-lms-core";
import { HttpClient, IHttpClientOptions, HttpClientResponse } from "@microsoft/sp-http";
import { ListService } from "./ListService";

export class SessionLawsService {
    private _sessionLawsApi: ISessionLawsApi;
    private _billsApi: IBillApi;
    constructor(private isLocalEnvironment: boolean) {
        this._sessionLawsApi = apiHelper.getSessionLawsApi(isLocalEnvironment);
        this._billsApi = apiHelper.getBillsApi(isLocalEnvironment);
    }

    public createSessionLaws(httpClient: HttpClient, accessToken: string, bill: IBills, isApproved: boolean): Promise<ISessionLaws> {
        return new Promise<ISessionLaws>((resolve, reject) => {
            ListService.getListProperties(this._sessionLawsApi.getWeb(), this._sessionLawsApi.listTitle)
                .then((listProperty) => {
                    const url: string = `${Constants.ServiceUrl.CreateSessionLaw}?webUrl=${config.getLmsUrl()}&listId=${listProperty.Id}` +
                        `&templateUrl=${Constants.LmsTemplates.SessionLawTemplateFileName}`;
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
                        .then((sessionLawBlob: Blob) => {
                            if (McsUtil.isDefined(sessionLawBlob)) {
                                const sessionDetail: string = (isApproved) ? `Approved` : `Became law without signature`;
                                this._sessionLawsApi.getListItems(`BillLookupId eq ${bill.Id}`).then((result) => {
                                    if (result.length > 0) {
                                        const sessionLaw: ISessionLaws = result[0];
                                        this._sessionLawsApi.updateSessionLaw(sessionLaw, sessionLaw, sessionLawBlob).then((value: ISessionLaws) => {
                                            resolve(value);
                                        }, (err) => {
                                            reject(err);
                                        });
                                    } else {
                                        const sessionLaws: ISessionLaws = {
                                            BillLookupId: bill.Id,
                                            Title: `Working Draft`,
                                            BillNumber: bill.BillNumber,
                                            LSONumber: bill.LSONumber,
                                            ApprovedDate: new Date(),
                                        };
                                        this._sessionLawsApi.createSessionLaw(sessionLaws, sessionLawBlob).then((value: ISessionLaws) => {
                                            resolve(value);
                                        }, (err) => {
                                            reject(err);
                                        });
                                    }
                                }, (err) => reject(err));
                            }
                        });

                }, (err) => { reject(err); });
        });
    }
}