import { Web, HttpClient, RenderListDataOptions, FileAddResult, Item } from "sp-pnp-js";
import { ControlMode } from "../controls/CustomListForm/ControlMode";
import { IFieldSchema } from "../controls/CustomListForm/RenderListData";
import { IList } from "mcs-lms-core";

export interface IFormValue {
    FieldName: string;
    FieldValue: any; HasException: boolean;
    ErrorMessage: string;
}

export class ListFormService {
    private _webUrl: string;
    private _web: Web;
    private _list: IList;
    private _listId: string;

    constructor(webUrl: string, listId: string) {
        this._webUrl = webUrl;
        this._web = new Web(webUrl);
        this._listId = listId;
        this._list = null;
    }

    /**
     * Retrieved list form schema for Control type
     * @param {ControlMode} formType The type of form (Display, New, Edit)
     * @returns {Promise<any[]>} Promise representing array of object containing list field information.
     * @memberof ListFormService
     */
    public getFieldSchemasForForm(formType: ControlMode): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this._web.lists.getById(this._listId).renderListDataAsStream({
                ViewXml: "<View><ViewFields><FieldRef Name=\"ID\"/></ViewFields></View>",
                RenderOptions: RenderListDataOptions.ClientFormSchema,
            }).then((data) => {
                const form: any = (formType === ControlMode.New) ? data.ClientForms.New : data.ClientForms.Edit;
                resolve(form[Object.keys(form)[0]]);
            }, (err) => { reject(err); });
        });
    }

    /**
     * Retrieves the data for a specified SharePoint list form.
     *
     * @param webUrl The absolute Url to the SharePoint site.
     * @param listUrl The server-relative Url to the SharePoint list.
     * @param itemId The ID of the list item to be updated.
     * @param formType The type of form (Display, New, Edit)
     * @returns Promise representing an object containing all the field values for the list item.
     */
    public getDataForForm(itemId: number, formType: ControlMode): Promise<any> {
        if ((!itemId) || (itemId === 0)) {
            return Promise.resolve({}); // no data, so returns empty
        }
        return new Promise<any>((resolve, reject) => {
            this._getListProperties().then(() => {
                const httpClient: HttpClient = new HttpClient();
                const endpoint: string = `${this._webUrl}/_api/web/GetList(@listUrl)/RenderExtendedListFormData`
                    + `(itemId=${itemId},formId='editform',mode='2',options=7)`
                    + `?@listUrl=${encodeURIComponent("'" + this._list.RootFolder.ServerRelativeUrl + "'")}`;
                httpClient.post("",
                    {
                        headers: {
                            "Accept": "application/json;odata=verbose",
                            "Content-type": "application/json;odata=verbose",
                            "X-SP-REQUESTRESOURCES": "listUrl=" + encodeURIComponent(this._list.RootFolder.ServerRelativeUrl),
                            "odata-version": "",
                        },
                    })
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            reject(response.statusText);
                        }
                    })
                    .then((data) => {
                        const extendedData: any = JSON.parse(data.d.RenderExtendedListFormData);
                        if (formType !== ControlMode.Display) {
                            resolve(extendedData.ListData);
                        } else {
                            resolve(extendedData.Data.Row[0]);
                        }
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });
    }

    public updateItem(itemId: number, fieldsSchema: IFieldSchema[], data: any, originalData: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._getListProperties().then(() => {
                const formValues: IFormValue[] = this.GetFormValues(fieldsSchema, data, originalData);
                const listUrl: string = this._list.RootFolder.ServerRelativeUrl;
                const endpoint: string = `${this._webUrl}/_api/web/GetList(@listUrl)/items(@itemId)/ValidateUpdateListItem()`
                    + `?@listUrl=${encodeURIComponent("'" + listUrl + "'")}&@itemId=%27${itemId}%27`;
                const httpClient: HttpClient = new HttpClient();
                httpClient.post(endpoint, {
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "Content-type": "application/json;odata=verbose",
                        "X-SP-REQUESTRESOURCES": "listUrl=" + encodeURIComponent(listUrl),
                        "odata-version": "",
                    },
                    body: JSON.stringify({
                        bNewDocumentUpdate: false,
                        checkInComment: null,
                        formValues,
                    }),
                }).then((response: Response) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        reject(this._getErrorMessage(response));
                    }
                }).then((respData) => {
                    resolve(respData.d.ValidateUpdateListItem.results);
                }).catch((error) => {
                    reject(this._getErrorMessage(error));
                });
            });
        });
    }

    public createItem(fieldsSchema: IFieldSchema[], data: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._getListProperties().then(() => {
                if (this._list.BaseTemplate === 101) {
                    // upload file
                    const file: File = data.FileLeafRef;
                    this._getFileBlob(file)
                        .then((blob) => {
                            return this._web.lists.getById(this._listId).rootFolder.files.add(file.name, blob, true);
                        }).then((fileAdded: FileAddResult) => {
                            return fileAdded.file.listItemAllFields.get();
                        }).then((fileItem) => {
                            data.FileLeafRef = file.name;
                            // getting error on this.
                            // return this.updateItem(fileItem.Id, fieldsSchema, data, {});
                            this.updateItem(fileItem.Id, fieldsSchema, data, {}).then((item) => {
                                if (item !== null) {
                                    resolve(item);
                                } else {
                                    reject("Error while editing.");
                                }
                            });
                        }).catch((error) => {
                            reject(this._getErrorMessage(error));
                        });
                }
                else {
                    this._createListItem(fieldsSchema, data).then((listItem) => {
                        resolve(listItem);
                    }, (err) => {
                        reject(this._getErrorMessage(err));
                    });
                }
            });
        });

    }

    private GetFormValues(fieldsSchema: IFieldSchema[], data: any, originalData: any): IFormValue[] {
        return fieldsSchema.filter(
            (field) => (
                (!field.ReadOnlyField)
                && (field.InternalName in data)
                && (data[field.InternalName] !== null)
                && (data[field.InternalName] !== originalData[field.InternalName])
            ),
        )
            .map((field) => {
                return {
                    ErrorMessage: null,
                    FieldName: field.InternalName,
                    FieldValue: data[field.InternalName],
                    HasException: false,
                };
            },
        );
    }

    private _getErrorMessage(error: any): string {
        let errorMessage: string = error.statusText ? error.statusText : error.statusMessage ? error.statusMessage : error;
        if (error.status === 403) {
            errorMessage = "You do not have access to the previously configured web url. Either leave the WebPart properties as is or select another web url.";
        } else if (error.status === 404) {
            errorMessage = "The previously configured web url '{0}' is not found anymore. Either leave the WebPart properties as is or select another web url.";
        }
        return errorMessage;
    }

    private _getListProperties(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._list) {
                resolve();
            } else {
                this._web.lists.getById(this._listId)
                    .select(...["Title", "RootFolder/ServerRelativeUrl", "Id", "BaseTemplate"])
                    .expand("RootFolder")
                    .get()
                    .then((data) => {
                        this._list = data;
                        resolve();
                    });
            }
        });

    }

    /**
     * Adds a new SharePoint list item to a list using the given data.
     *
     * @param webUrl The absolute Url to the SharePoint site.
     * @param listUrl The server-relative Url to the SharePoint list.
     * @param fieldsSchema The array of field schema for all relevant fields of this list.
     * @param data An object containing all the field values to set on creating item.
     * @returns Promise object represents the updated or erroneous form field values.
     */
    private _createListItem(fieldsSchema: IFieldSchema[], data: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._getListProperties().then(() => {
                const formValues: IFormValue[] = this.GetFormValues(fieldsSchema, data, {});
                const httpClient: HttpClient = new HttpClient();
                const listUrl: string = this._list.RootFolder.ServerRelativeUrl;
                const endpoint: string = `${this._webUrl}/_api/web/GetList(@listUrl)/AddValidateUpdateItemUsingPath`
                    + `?@listUrl=${encodeURIComponent("'" + listUrl + "'")}`;
                httpClient.post(endpoint, {
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "Content-type": "application/json;odata=verbose",
                        "X-SP-REQUESTRESOURCES": "listUrl=" + encodeURIComponent(listUrl),
                        "odata-version": "",
                    },
                    body: JSON.stringify({
                        listItemCreateInfo: {
                            __metadata: { type: "SP.ListItemCreationInformationUsingPath" },
                            FolderPath: {
                                __metadata: { type: "SP.ResourcePath" },
                                DecodedUrl: listUrl,
                            },
                        },
                        formValues,
                        bNewDocumentUpdate: false,
                        checkInComment: null,
                    }),
                }).then((response: Response) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        reject(this._getErrorMessage(response));
                    }
                }).then((respData) => {
                    resolve(respData.d.AddValidateUpdateItemUsingPath.results);
                }).catch((error) => {
                    reject(this._getErrorMessage(error));
                });
            });
        });
    }

    private _getFileBlob(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader: FileReader = new FileReader();
            reader.onloadend = (e: any) => {
                resolve(e.target.result);
            };
            reader.onerror = (e: any) => {
                reject(e.target.error);
            };
            reader.readAsArrayBuffer(file);
        });
    }
}