import { HttpClient, HttpClientConfiguration, HttpClientResponse, IHttpClientOptions } from "@microsoft/sp-http";
import { IElementsAffected, IElementsAffectedApi, IBills, apiHelper, Constants, McsUtil } from "mcs-lms-core";
import { ODataBatch } from "sp-pnp-js";
import { BillsService } from "./BillsService";

// tslint:disable:object-literal-key-quotes
export interface IGetStatuteResponse extends HttpClientResponse {
    HasError: boolean;
    Message: string;
    StatuteCollection: IElementsAffected[];
}

export interface IUpdateBillResponse {
    Bill: IBills;
    ElementAffected: IElementsAffected[];
}

export class ElementsAffectedService {
    private _elementsAffectedApi: IElementsAffectedApi;

    constructor(private isLocalEnvironment: boolean) {
        this._elementsAffectedApi = apiHelper.getElementsAffectedApi(isLocalEnvironment);
    }

    /**
     * Get items from elements affected for a bill
     * @param {number} billId
     * @returns {Promise<IElementsAffected[]>}
     * @memberof ElementsAffectedService
     */
    public getElementsAffectedForBill(billId: number): Promise<IElementsAffected[]> {
        return this._elementsAffectedApi.getElementsAffectedForBill(billId);
    }

    /**
     * Get items to insert into SharePoint list.
     * This method calls web api which validates input and return expanded result
     * This is being used by elements affected form.
     * @param {HttpClient} httpClient
     * @param {string} accessToken
     * @param {number} year
     * @param {number} billId
     * @param {string} lsonumber
     * @param {string} elementType
     * @param {string} element
     * @param {string} [elementAs=""]
     * @param {string} [elementThough=""]
     * @param {string} [elementAsThrough=""]
     * @param {boolean} [intro=false]
     * @param {string} [rangeType="Through"]
     * @returns {Promise<IGetStatuteResponse>}
     * @memberof ElementsAffectedService
     */
    public getItemsToInsert(httpClient: HttpClient, accessToken: string, year: number, billId: number,
        lsonumber: string, elementType: string, element: string, elementAs: string = "",
        elementThough: string = "", elementAsThrough: string = "", intro: boolean = false,
        rangeType: string = "Through"): Promise<IGetStatuteResponse> {
        return new Promise<IGetStatuteResponse>((resolve, reject) => {
            const url: string = Constants.ServiceUrl.GetStatuteElements +
                "?year=" + year + "&billId=" + billId + "&lsonumber=" + lsonumber + "&elementType=" + elementType +
                "&element=" + element + "&elementAs=" + elementAs +
                "&elementThough=" + elementThough + "&elementAsThrough=" + elementAsThrough +
                "&intro=" + intro + "&rangeType=" + rangeType;
            const requestHeaders: Headers = new Headers();
            requestHeaders.append("Accept", "application/json");
            requestHeaders.append("Content-type", "application/json");
            requestHeaders.append("Cache-Control", "no-cache");
            requestHeaders.append("Authorization", "Bearer " + accessToken);

            const httpClientOptions: IHttpClientOptions = {
                headers: requestHeaders,
            };
            httpClient.get(url, HttpClient.configurations.v1, httpClientOptions)
                .then((response: HttpClientResponse): Promise<any> => {
                    if (!response.ok) {
                        reject(response.statusText);
                    } else {
                        return response.json();
                    }
                }).then((response1: IGetStatuteResponse) => {
                    resolve(response1);
                }, (error: any): void => {
                    reject(error);
                });
        });
    }

    /**
     * Insert elements affected into SharePoint list.
     * Also check if there are any duplicates for elements being inserted.
     *
     * @param {IElementsAffected[]} elements
     * @returns {Promise<IElementsAffected[]>}
     * @memberof ElementsAffectedService
     */
    public insertIntoList(elements: IElementsAffected[]): Promise<IElementsAffected[]> {
        return new Promise<IElementsAffected[]>((resolve, reject) => {
            this._elementsAffectedApi.getDuplicates(elements).then((duplicateElements: IElementsAffected[]) => {
                if (duplicateElements.length > 0) {
                    const updateBatch: ODataBatch = this._elementsAffectedApi.getBatch();
                    duplicateElements.forEach((value) => {
                        if (!value.DuplicateElement) {
                            this._elementsAffectedApi.updateItemInBatch(updateBatch, value.Id, value["odata.type"], { "DuplicateElement": true });
                        }
                    });
                    updateBatch.execute();
                }
                const addBatch: ODataBatch = this._elementsAffectedApi.getBatch();
                const insertedItem: IElementsAffected[] = [];
                elements.forEach((value) => {
                    let duplicate: boolean = false;
                    // tslint:disable-next-line:prefer-for-of
                    for (let i: number = 0; i < duplicateElements.length; i++) {
                        if (duplicateElements[i].NewElementNumberDbFormat === value.NewElementNumberDbFormat) {
                            duplicate = true;
                            break;
                        }
                    }
                    value.DuplicateElement = duplicate;
                    this._elementsAffectedApi.addNewItemInBatch(addBatch, value)
                        .then((newItem) => {
                            const test: IElementsAffected = newItem.data as IElementsAffected;
                            insertedItem.push(test);
                        });
                });
                addBatch.execute().then(() => {
                    resolve(insertedItem);
                });
            });
        });
    }

    /**
     * Delete item from element affected SharePoint list.
     * Also, check for duplicates and ensure its value.
     * @param {IElementsAffected} element
     * @returns {Promise<void>}
     * @memberof ElementsAffectedService
     */
    public deleteElementAffected(element: IElementsAffected): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._elementsAffectedApi.getDuplicates([element]).then((duplicateElements: IElementsAffected[]) => {
                duplicateElements = duplicateElements.filter((value) => {
                    return value.BillLookupId !== element.BillLookupId;
                });
                if (duplicateElements.length === 1) {
                    duplicateElements.forEach((value) => {
                        this._elementsAffectedApi.updateItem(value.Id, value["odata.type"], { "DuplicateElement": false });
                    });
                }
                this._elementsAffectedApi.deleteItem(element.Id).then(() => {
                    resolve();
                }, (err) => { reject(err); });
            });
        });
    }

    /**
     * Calls rest api to insert elements affected to document,
     * updates bill in document library,
     * ensures elements affected property ElementApplied is set to true
     * @param {HttpClient} httpClient
     * @param {string} accessToken
     * @param {string} webUrl
     * @param {boolean} createSectiontitle
     * @param {IElementsAffected[]} elementsAffected
     * @param {IBills} bill
     * @returns {Promise<IUpdateBillResponse>}
     * @memberof ElementsAffectedService
     */
    public insertIntoBill(httpClient: HttpClient, accessToken: string, webUrl: string, createSectiontitle: boolean,
        elementsAffected: IElementsAffected[], bill: IBills): Promise<IUpdateBillResponse> {
        const postData: any = {
            WebUrl: webUrl,
            CreateSectionTitle: createSectiontitle,
            ElementsAffected: elementsAffected,
        };
        return new Promise<IUpdateBillResponse>((resolve, reject) => {
            const requestHeaders: Headers = new Headers();
            // requestHeaders.append("Accept", "application/json");
            requestHeaders.append("Content-type", "application/json");
            requestHeaders.append("Cache-Control", "no-cache");
            requestHeaders.append("Authorization", "Bearer " + accessToken);

            const httpClientOptions: IHttpClientOptions = {
                body: JSON.stringify(postData),
                headers: requestHeaders,
            };
            httpClient.post(Constants.ServiceUrl.InsertStatuteElements, HttpClient.configurations.v1, httpClientOptions)
                .then((response: HttpClientResponse): Promise<Blob> => {
                    if (!response.ok) {
                        reject(response.statusText);
                    } else {
                        return response.blob();
                    }
                }).then((billBlob: Blob) => {
                    if (McsUtil.isDefined(billBlob)) {
                        const billsService: BillsService = new BillsService(this.isLocalEnvironment);
                        billsService.updateBillDocument(bill, null, billBlob, "Elements affected inserted.", false).then((updatedBill) => {
                            const updateBatch: ODataBatch = this._elementsAffectedApi.getBatch();
                            // const updateBatchPromises: Array<Promise<void>> = [];
                            elementsAffected.forEach((value) => {
                                if (!!value.ElementApplied) {
                                    const proertyToUpdate: any = {
                                        ElementApplied: true,
                                    };
                                    value.ElementApplied = true;
                                    this._elementsAffectedApi.updateItemInBatch(updateBatch, value.Id, value["odata.type"], proertyToUpdate);
                                }
                            });
                            updateBatch.execute().then(() => {
                                resolve({ Bill: updatedBill, ElementAffected: elementsAffected });
                            });

                        }, (error: any): void => { reject(error); });
                    }
                }, (error: any): void => { reject(error); });

        });
    }

    public getElementsAffectedFromBill(httpClient: HttpClient, accessToken: string, webUrl: string, billId: number, elementsAffectedFromUi: IElementsAffected[]):
        Promise<IElementsAffected[]> {
        return new Promise<IElementsAffected[]>((resolve, reject) => {
            const requestHeaders: Headers = new Headers();
            // requestHeaders.append("Accept", "application/json");
            requestHeaders.append("Content-type", "application/json");
            requestHeaders.append("Cache-Control", "no-cache");
            requestHeaders.append("Authorization", "Bearer " + accessToken);
            const httpClientOptions: IHttpClientOptions = {
                headers: requestHeaders,
            };
            httpClient.get(Constants.ServiceUrl.InsertStatuteElements + `?webUrl=${webUrl}&billId=${billId}`, HttpClient.configurations.v1, httpClientOptions)
                .then((response: HttpClientResponse): Promise<IElementsAffected[]> => {
                    if (!response.ok) {
                        resolve(null);
                    } else {
                        return response.json();
                    }
                }).then((elementsAffectedFromBill: IElementsAffected[]) => {
                    if (McsUtil.isArray(elementsAffectedFromBill)) {
                        return this._updateElementsAffected(elementsAffectedFromBill, elementsAffectedFromUi);
                    } else {
                        resolve([]);
                    }
                }, (error: any): void => { reject(error); });
        });
    }

    private _updateElementsAffected(elementsAffectedFromBill: IElementsAffected[], elementsAffectedFromUi: IElementsAffected[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let billIndex: number = 0;
            let uiIndex: number = 0;
            if (elementsAffectedFromUi.length === 0 && elementsAffectedFromBill.length === 0) {
                resolve([]);
            } else {
                this._elementsAffectedApi.getDuplicates(elementsAffectedFromBill.concat(elementsAffectedFromUi))
                    .then((duplicates) => {
                        let listItemEntityTypeFullName: string;
                        const updateBatch: ODataBatch = this._elementsAffectedApi.getBatch();
                        let containsUpdateBatch: boolean = false;
                        if (elementsAffectedFromUi.length > 0) {
                            containsUpdateBatch = true;
                            listItemEntityTypeFullName = elementsAffectedFromUi[0]["odata.type"];
                            for (; uiIndex < elementsAffectedFromUi.length; uiIndex++) {
                                const temp1: IElementsAffected = elementsAffectedFromUi[uiIndex];
                                if (billIndex > elementsAffectedFromBill.length) {
                                    const temp2: IElementsAffected = elementsAffectedFromBill[billIndex];
                                    this._elementsAffectedApi.updateItemInBatch(updateBatch,
                                        elementsAffectedFromUi[uiIndex].Id,
                                        listItemEntityTypeFullName,
                                        {
                                            BillLookupId: temp1.BillLookupId,
                                            DuplicateElement: false,
                                            ElementApplied: true,
                                            ElementType: temp2.ElementType,
                                            Intro: temp2.Intro,
                                            NewElementNumber: temp2.NewElementNumber,
                                            NewElementNumberDbFormat: temp2.NewElementNumberDbFormat,
                                        });
                                    billIndex = billIndex + 1;
                                } else {
                                    break;
                                }
                            }
                        }
                    });
            }
        });
    }
}
