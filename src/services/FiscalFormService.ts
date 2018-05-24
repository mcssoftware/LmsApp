import * as pnp from "sp-pnp-js";
import { HttpClient, IHttpClientOptions, HttpClientResponse } from "@microsoft/sp-http";
import { IFiscalNoteYear, IFiscalNoteForm } from "../webparts/fiscalNoteForm/components/IFiscalNoteForm";
import { AdditionalDocumentService, DocumentType } from "./AdditionalDocumentService";
import { McsUtil, IBills, Constants, config, IAgencyContact, apiHelper, IFiscalFund, IFiscalSeries, IListApi } from "mcs-lms-core";

export enum FiscalType {
    FiscalDirective = 0,
    FiscalImpactRequest,
    FiscalNote,
}

export class FiscalFormService {
    private _additionalDocumentService: AdditionalDocumentService;

    constructor(private _fiscalType: FiscalType) {
        this._additionalDocumentService = new AdditionalDocumentService();
    }

    public getItems<T>(httpClient: HttpClient, token: string, filter?: string, select?: string[], expand?: string[],
        orderBy?: string, ascending?: boolean, skip?: number, top?: number): Promise<T[]> {
        const url: string = this._getServiceUrlToGetItems(this._fiscalType);
        const option: IHttpClientOptions = this._getHttpOption(token);
        return new Promise<T[]>((resolve, reject) => {
            httpClient.get(url, HttpClient.configurations.v1, this._getHttpOption(token))
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        reject(response.statusText);
                    }
                }, (err) => { reject(err); })
                .then((odataResponse) => {
                    if (McsUtil.isDefined(odataResponse)) {
                        resolve(odataResponse);
                    }
                });
        });
    }

    public getItemByLsoNumber(httpClient: HttpClient, lsoNumber: string, token: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            httpClient.get(`${this._getServiceUrlToGetItems(this._fiscalType)}&$filter=LSONumber eq '${lsoNumber}'`, HttpClient.configurations.v1, this._getHttpOption(token))
                .then((response: HttpClientResponse) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        return Promise.resolve(null);
                    }
                }, (err) => {
                    reject(err);
                }).then((result) => {
                    if (McsUtil.isDefined(result)) {
                        resolve(result[0]);
                    } else {
                        resolve(null);
                    }
                });
        });
    }

    public getFiscalItemByLsoNumber(fiscalType: FiscalType, httpClient: HttpClient, lsoNumber: string, token: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            httpClient.get(`${this._getServiceUrlToGetItems(fiscalType)}&$filter=LSONumber eq '${lsoNumber}'`, HttpClient.configurations.v1, this._getHttpOption(token))
                .then((response: HttpClientResponse) => {
                    return response.json();
                }, (err) => {
                    resolve(null);
                }).then((result: any[]) => {
                    if (McsUtil.isArray(result) && result.length > 0) {
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                });
        });
    }

    public getItemById(httpClient: HttpClient, id: number, token: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            // let select: string[] = this.getSelects();
            // tslint:disable-next-line:prefer-const
            httpClient.get(this._getServiceUrlToGetItems(this._fiscalType), HttpClient.configurations.v1, this._getHttpOption(token)).then((response: HttpClientResponse) => {
                if (response.ok) {
                    response.json().then((odataResponse) => {
                        McsUtil.isArray(odataResponse) && odataResponse.length > 0 ? resolve(odataResponse[0]) : resolve(odataResponse);
                    });
                } else {
                    reject(response.statusText);
                }
            }, (err) => { reject(err); });
        });
    }

    public addNewItem(httpClient: HttpClient, bill: IBills, properties: any, token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            httpClient.post(this._getServiceUrlToGetItems(this._fiscalType, properties.Id).split("?")[0],
                HttpClient.configurations.v1,
                this._getHttpOption(token, properties)).then((response: HttpClientResponse) => {
                    response.json().then((result) => {
                        if (McsUtil.isDefined(result)) {
                            if (result.error) {
                                reject(result.error);
                            } else {
                                const data: any = McsUtil.isArray(result) ? result[0] : result;
                                if (this._fiscalType === FiscalType.FiscalNote || this._fiscalType === FiscalType.FiscalDirective) {
                                    this._getDocument(httpClient, token, data).then((document: Blob) => {
                                        this._additionalDocumentService.addOrUpdateDocument("", this._getDocumentType(), bill, document)
                                            .then(() => resolve(data), (err) => reject(err));
                                    }, (error) => { reject(error); });
                                } else {
                                    resolve(data);
                                }
                            }
                        } else {
                            reject("Error posting data.");
                        }
                    }, (error) => {
                        reject(error);
                    });
                }, (error) => { reject(error); });
        });
    }

    public updateItem(httpClient: HttpClient, bill: IBills, properties: any, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const option: IHttpClientOptions = this._getHttpOption(token, properties);
            option.method = "PUT";
            httpClient.fetch(this._getServiceUrlToGetItems(this._fiscalType, properties.Id).split("?")[0], HttpClient.configurations.v1, option)
                .then((response: HttpClientResponse) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        reject(response.statusText);
                    }
                }, (error) => {
                    reject(error);
                }).then((result) => {
                    if (McsUtil.isDefined(result)) {
                        if (result.error) {
                            reject(result.error);
                        } else {
                            const data: any = McsUtil.isArray(result) ? result[0] : result;
                            if (this._fiscalType === FiscalType.FiscalNote || this._fiscalType === FiscalType.FiscalDirective) {
                                let generatorDocument: boolean = true;
                                if (this._fiscalType === FiscalType.FiscalNote && !(properties as IFiscalNoteForm).RegenerateFiscalNote) {
                                    generatorDocument = false;
                                }
                                if (generatorDocument) {
                                    this._getDocument(httpClient, token, data).then((document: Blob) => {
                                        this._additionalDocumentService.addOrUpdateDocument("", this._getDocumentType(), bill, document)
                                            .then(() => resolve(data), (err) => reject(err));
                                    }, (error) => { reject(error); });
                                } else {
                                    resolve();
                                }
                            } else {
                                resolve(data);
                            }
                        }
                    }
                });
        });
    }

    public generateFiscalNoImpactDocument(httpClient: HttpClient, fiscalDirectiveId: number, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const option: IHttpClientOptions = this._getHttpOption(token, null);
            httpClient.get(`${Constants.ServiceUrl.FiscalNoImpactDocument}?webUrl=${config.getLmsUrl()}` +
                `&templateUrl=${Constants.LmsTemplates.FiscalNoteNoImpactTemplateFileName}&fiscalDirectiveId=${fiscalDirectiveId}`,
                HttpClient.configurations.v1, option)
                .then((response: HttpClientResponse) => {
                    if (response.ok) {
                        return response.blob();
                    } else {
                        reject(response.statusText);
                    }
                }, (err) => {
                    reject(err);
                })
                .then((documentBlob: Blob) => {
                    if (McsUtil.isDefined(documentBlob)) {
                        // this._billsApi.createBill(this.updateProperties({} as IBills, bdr, billyear, false), billBlob)
                        //     .then((newBill: IBills) => {
                        //         resolve(newBill);
                        //     }, (err) => {
                        //         reject(err);
                        //     });
                    }
                });
        });
    }

    public getFiscalAgencyContact(): Promise<IAgencyContact[]> {
        const agencyContactApi: IListApi<IAgencyContact> = apiHelper.getAgencyContactApi(false);
        return agencyContactApi.getListItems("", null, null, "AgencyName", true);
    }

    public getFiscalFunds(): Promise<IFiscalFund[]> {
        const fiscalFundApi: IListApi<IFiscalFund>  = apiHelper.getFiscalFundApi(false);
        return fiscalFundApi.getListItems("", null, null, "Title", true);
    }

    public getFiscalSeries(): Promise<IFiscalSeries[]> {
        const fiscalSeriesApi: IListApi<IFiscalSeries> = apiHelper.getFiscalSeries(false);
        return fiscalSeriesApi.getListItems("", null, null, "Title", true);
    }

    public getUniqueAgency(allAgencyList: IAgencyContact[]): IAgencyContact[] {
        const length: number = allAgencyList.length;
        const result: IAgencyContact[] = [];
        const seen: Set<string> = new Set();
        for (let index: number = 0; index < length; index++) {
            const value: IAgencyContact = allAgencyList[index];
            if (seen.has(value.Title)) {
                continue;
            }
            seen.add(value.Title);
            result.push(value);
        }
        return result;
    }

    public getFiscalNoteYears(httpClient: HttpClient, token: string, filter?: string): Promise<IFiscalNoteYear[]> {
        return new Promise<IFiscalNoteYear[]>((resolve, reject) => {
            let url: string = Constants.ServiceUrl.FiscalNoteYear;
            if (McsUtil.isString(filter)) {
                url += filter;
            }
            httpClient.get(url, HttpClient.configurations.v1, this._getHttpOption(token)).then((response: HttpClientResponse) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return Promise.resolve(null);
                }
            }, (err) => {
                return Promise.resolve(null);
            }).then((result) => {
                resolve(result);
            });
        });
    }

    public getFiscalNoteYearsByYear(httpClient: HttpClient, token: string, billYear: number): Promise<IFiscalNoteYear[]> {
        return new Promise<IFiscalNoteYear[]>((resolve, reject) => {
            const url: string = Constants.ServiceUrl.FiscalNoteYear;
            if (McsUtil.isNumeric(billYear)) {
                this.getFiscalNoteYears(httpClient, token, `?$filter=CurrentYear eq ${billYear}`)
                    .then((result) => {
                        resolve(result);
                    });
            } else {
                apiHelper.getConfigurationApi(false).getYear().then((year) => {
                    this.getFiscalNoteYears(httpClient, token, `?$filter=CurrentYear eq ${year}`).then((result) => {
                        resolve(result);
                    }, (error) => {
                        reject(error);
                    });
                }, (error) => {
                    reject(error);
                });
            }
        });
    }

    private _getDocument(httpClient: HttpClient, token: string, fiscalFormProperties: any): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            httpClient.get(this._getDocumentGenerationUrl(fiscalFormProperties), HttpClient.configurations.v1, this._getHttpOption(token))
                .then((response: HttpClientResponse) => {
                    if (response.ok) {
                        return response.blob();
                    } else {
                        reject(response.statusText);
                    }
                }, (error) => {
                    reject(error);
                }).then((document: Blob) => {
                    resolve(document);
                }, (error) => {
                    reject(error);
                });
        });
    }

    private _getDocumentGenerationUrl(fiscalFormProperties: any): string {
        switch (this._fiscalType) {
            case FiscalType.FiscalDirective:
                {
                    return `${Constants.ServiceUrl.FiscalNoImpactDocument}?` +
                        `webUrl=${config.getLmsUrl()}&templateUrl=${Constants.LmsTemplates.FiscalNoteNoImpactTemplateFileName}&FiscalDirectiveId=${fiscalFormProperties.Id}`;
                }
            case FiscalType.FiscalNote:
                {
                    return `${Constants.ServiceUrl.FiscalImpactDocument}?` +
                        `webUrl=${config.getLmsUrl()}&templateUrl=${Constants.LmsTemplates.FiscalNoteNoImpactTemplateFileName}&fiscalNoteId=${fiscalFormProperties.Id}`;
                }
            case FiscalType.FiscalImpactRequest:
            default:
                return "";
        }
    }

    private _getServiceUrlToGetItems(fiscalType: FiscalType, id?: number): string {
        const itemUrl: string = McsUtil.isDefined(id) ? `/${id}` : "";
        switch (fiscalType) {
            case FiscalType.FiscalDirective:
                return `${Constants.ServiceUrl.FiscalDirective}${itemUrl}?$expand=FiscalDirectiveAgencies`;
            case FiscalType.FiscalNote:
                return `${Constants.ServiceUrl.FiscalNote}${itemUrl}?` +
                    `$expand=AdministrativeImpactAgencies,FiscalNoteAgencyContacts,NonAdminAnticipatedExpenditures,NonAdminAnticipatedRevenues`;
            case FiscalType.FiscalImpactRequest:
                return `${Constants.ServiceUrl.FiscalImpact}${itemUrl}?$expand=FiscalImpactAttachments,FiscalImpactAgencyInfoes/FiscalImpactAgencyCCs`;
            default:
                return "";
        }
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

    private _getDocumentType(): DocumentType {
        return DocumentType.FiscalNote;
    }
}

export function getFiscalUrl(fiscalType: FiscalType, lsoNumber: string): string {
    switch (fiscalType) {
        case FiscalType.FiscalImpactRequest:
            return McsUtil.combinePaths(config.getLmsUrl(), `${Constants.Pages.FiscalImpactForm}?lsonumber=${lsoNumber}`);
        case FiscalType.FiscalDirective:
            return McsUtil.combinePaths(config.getLmsUrl(), `${Constants.Pages.FiscalDirectiveForm}?lsonumber=${lsoNumber}`);
        case FiscalType.FiscalNote:
            return McsUtil.combinePaths(config.getLmsUrl(), `${Constants.Pages.FiscalNoteForm}?lsonumber=${lsoNumber}`);
    }
}
