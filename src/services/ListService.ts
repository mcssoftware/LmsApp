import { Web, NodeFetchClientUnsupportedException, SiteUserProps } from "sp-pnp-js";
import {
    IList, IContentType, IView, IField, IListItem, IDocumentItem,
    ITasks, IBills, McsUtil, Constants,
} from "mcs-lms-core";
import { IViewField } from "../controls/ListView/IListView";
import { IColumn } from "office-ui-fabric-react";
import React = require("react");
import { FileNameColumn } from "../controls/FileNameColumn/FileNameColumn";
import { PeopleService } from "./PeopleService";

export interface IListOrder {
    orderBy: string;
    ascending: boolean;
}

export interface IListRestFilter {
    listProperties: IList;
    viewFields: IViewField[];
    select: string[];
    expand: string[];
    order: IListOrder[];
    filter: string;
}

export class ListService {

    public static getListFromWeb(webUrl: string): Promise<IList[]> {
        return new Promise<IList[]>((resolve, reject) => {
            (new Web(webUrl)).lists
                .select(...["Title", "RootFolder/ServerRelativeUrl", "Id"])
                .expand("RootFolder")
                .filter("(IsPrivate eq false) and (IsCatalog eq false) and (Hidden eq false)").get()
                .then((value: IList[]) => {
                    resolve(value);
                }, (err) => { reject(err); });
        });
    }

    public static getLsoLists(webUrl: string): Promise<IList[]> {
        return new Promise<IList[]>((resolve, reject) => {
            const web: Web = new Web(webUrl);
            web.lists
                .select(...["Title", "RootFolder/ServerRelativeUrl", "Id", "BaseTemplate"])
                .expand("RootFolder")
                .filter("(IsPrivate eq false) and (IsCatalog eq false) and (Hidden eq false)").get()
                .then((listsResult: IList[]) => {
                    Promise.all(listsResult.map((v) => {
                        return web.lists.getById(v.Id).fields
                            .filter("InternalName eq 'LSONumber' or InternalName eq 'BillLookup'")
                            .select(...["Id", "InternalName", "TypeAsString"])
                            .top(1)
                            .get();
                    })).then((fieldResult) => {
                        const tempLists: IList[] = [];
                        for (let i: number = 0; i < listsResult.length; i++) {
                            if (fieldResult[i].length > 0) {
                                listsResult[i].Fields = fieldResult[i] as IField[];
                                tempLists.push(listsResult[i]);
                            }
                        }
                        resolve(tempLists);
                    });
                }, (err) => { reject(err); });
        });
    }

    public static getListViews(webUrl: string, listId: string): Promise<Array<{ url: string, title: string, id: string }>> {
        return new Promise<Array<{ url: string, title: string, id: string }>>((resolve, reject) => {
            (new Web(webUrl)).lists.getById(listId).views
                .select(...["Title", "ServerRelativeUrl", "Id"])
                .filter("Hidden eq false")
                .get().then((value: IView[]) => {
                    resolve(value.map((v) => {
                        return { url: v.ServerRelativeUrl, title: v.Title, id: v.Id };
                    }));
                }, (err) => { reject(err); });
        });
    }

    public static getFilterFromCaml(viewQuery: string, allListFields: IField[]): string {
        if (McsUtil.isString(viewQuery)) {
            try {
                const parser: DOMParser = new DOMParser();
                const xmlDoc: Document = parser.parseFromString("<View>" + viewQuery + "</View>", "text/xml");
                const whereElement: NodeListOf<Element> = xmlDoc.getElementsByTagName("Where");
                if (whereElement.length > 0 && whereElement[0].hasChildNodes) {
                    return this._getRestFilter(whereElement[0].firstElementChild, allListFields);
                }
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    public static getRestOrderBy(viewQuery: string, allListFields: IField[]): IListOrder[] {
        if (McsUtil.isString(viewQuery)) {
            try {
                const parser: DOMParser = new DOMParser();
                const xmlDoc: Document = parser.parseFromString(viewQuery, "text/xml");
                const orderBy: NodeListOf<Element> = xmlDoc.getElementsByTagName("OrderBy");
                if (orderBy.length > 0) {
                    const fieldRefs: NodeListOf<Element> = orderBy[0].getElementsByTagName("FieldRef");
                    const orderByFields: IListOrder[] = [];
                    // tslint:disable-next-line:prefer-for-of
                    for (let i: number = 0; i < fieldRefs.length; i++) {
                        const fld: Element = fieldRefs[i];
                        const ascending: boolean = fld.hasAttribute("Ascending") && (fld.getAttribute("Ascending") === "TRUE");
                        orderByFields.push({ orderBy: fld.getAttribute("Name"), ascending });
                    }
                    if (orderByFields.length > 0) {
                        const dependentLookupFields: IField[] = allListFields.filter((f) => f.IsDependentLookup && f.TypeAsString === "Lookup");
                        const primaryLookupFields: IField[] = allListFields.filter((f) => !f.IsDependentLookup && f.TypeAsString === "Lookup");
                        if (dependentLookupFields.length > 0) {
                            orderByFields.forEach((e) => {
                                const f: IField[] = dependentLookupFields.filter((f1) => f1.InternalName === e.orderBy);
                                if (f.length > 0) {
                                    const p1: IField[] = primaryLookupFields.filter((p) => p.Id === f[0].PrimaryFieldId);
                                    e.orderBy = p1[0].InternalName + "/" + f[0].LookupField;
                                }
                            });
                        }
                        return orderByFields;
                    }
                }
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    public static getRestQueryforView(webUrl: string, listId: string, viewId: string): Promise<IListRestFilter> {
        return new Promise<IListRestFilter>((resolve, reject) => {
            if (McsUtil.isString(webUrl) && McsUtil.isString(listId) && McsUtil.isString(viewId)) {
                const web: Web = new Web(webUrl);
                const peopleService: PeopleService = new PeopleService();
                Promise.all([
                    ListService.getListPropertiesById(webUrl, listId),
                    web.lists.getById(listId).views.getById(viewId).select("ViewQuery").get(),
                    web.lists.getById(listId).views.getById(viewId).fields.get(),
                    web.lists.getById(listId).fields
                        .select(...["InternalName", "Sortable", "Title", "TypeAsString", "IsDependentLookup", "LookupField", "PrimaryFieldId", "Id"])
                        .filter("Hidden eq false")
                        .get(),
                    peopleService.loadCurrentUser(),
                ]).then((response) => {
                    const listProperties: IList = response[0];
                    const queryResponse: IView = response[1];
                    const fieldsOnViews: string[] = response[2].Items as string[];
                    const allListFields: IField[] = response[3] as IField[];
                    const currentUser: SiteUserProps = response[4];

                    const viewFields: IField[] = fieldsOnViews.map((v) => {
                        // tslint:disable-next-line:prefer-for-of
                        for (let i: number = 0; i < allListFields.length; i++) {
                            if (allListFields[i].InternalName === v) {
                                return allListFields[i];
                            }
                        }
                    });

                    const select: string[] = [];
                    const expand: string[] = [];
                    const viewQuery: string = queryResponse.ViewQuery
                        .replace('<UserID Type="Integer" />', currentUser.Id.toString())
                        .replace("<UserID/>", currentUser.Id.toString());
                    const listColumns: IViewField[] = [];
                    viewFields.forEach((f) => {
                        switch (f.TypeAsString) {
                            case "DateTime":
                                select.push(f.InternalName);
                                listColumns.push({
                                    name: f.InternalName,
                                    displayName: f.Title,
                                    sorting: f.Sortable,
                                    maxWidth: 110,
                                    render: (item?: any, index?: number, column?: IColumn): any => {
                                        if (McsUtil.isDefined(item) && item.hasOwnProperty(column.key) && McsUtil.isDefined(item[column.key])) {
                                            const dateValue: Date = new Date(item[column.key]);
                                            if (dateValue.getFullYear() === new Date(Date.now()).getFullYear()) {
                                                return dateValue.format("MMMM d");
                                            }
                                            return dateValue.format("MMMM d, yyyy");
                                        }
                                        return "";
                                    },
                                });
                                break;
                            case "User":
                                // temp = f.InternalName + "/Title";
                                select.push(f.InternalName + "/Title");
                                if (expand.indexOf(f.InternalName) < 0) {
                                    expand.push(f.InternalName);
                                }
                                listColumns.push({
                                    name: f.InternalName + ".Title",
                                    displayName: f.Title,
                                    sorting: f.Sortable,
                                    maxWidth: 110,
                                });
                                break;
                            case "Lookup":
                                if (!f.IsDependentLookup) {
                                    // temp = f.InternalName + "/" + f.LookupField;
                                    select.push(f.InternalName + "/" + f.LookupField);
                                    if (expand.indexOf(f.InternalName) < 0) {
                                        expand.push(f.InternalName);
                                    }
                                    const fieldLookup: IViewField = {
                                        name: f.InternalName + "." + f.LookupField,
                                        displayName: f.LookupField,
                                        sorting: f.Sortable,
                                    };
                                    listColumns.push(fieldLookup);
                                    if (f.LookupField === "LSONumber") {
                                        fieldLookup.render = (item?: any, index?: number, column?: IColumn): any => {
                                            if (McsUtil.isDefined(item)) {
                                                const linkTitleUrl: string = McsUtil.combinePaths(webUrl, `${Constants.Pages.DraftingDesktop}?LsoNumber=${item[column.fieldName]}`);
                                                return React.createElement("a", { href: linkTitleUrl }, item[column.fieldName]);
                                            }
                                            return "";
                                        };
                                    }
                                } else {
                                    // need to get field
                                    const primaryFields: IField[] = allListFields.filter((v) => v.Id === f.PrimaryFieldId);
                                    if (primaryFields.length > 0) {
                                        // temp = primaryFields[0].InternalName + "/" + f.LookupField;
                                        if (expand.indexOf(primaryFields[0].InternalName) < 0) {
                                            expand.push(primaryFields[0].InternalName);
                                        }
                                        select.push(primaryFields[0].InternalName + "/" + f.LookupField);
                                        listColumns.push({
                                            name: primaryFields[0].InternalName + "." + f.LookupField,
                                            displayName: f.LookupField,
                                            sorting: f.Sortable,
                                        });
                                    }
                                }
                                break;
                            case "Boolean":
                                // temp = f.InternalName + "/Title";
                                select.push(f.InternalName);
                                const fieldBoolean: IViewField = {
                                    name: f.InternalName,
                                    displayName: f.Title,
                                    sorting: f.Sortable,
                                    maxWidth: 50,
                                };
                                listColumns.push(fieldBoolean);
                                fieldBoolean.render = (item?: any, index?: number, column?: IColumn): any => {
                                    return React.createElement("span", {}, item[column.fieldName] ? "Yes" : "No");
                                };
                                break;
                            default:
                                select.push(f.InternalName);
                                if (f.InternalName !== "DocIcon") {
                                    const field: IViewField = {
                                        name: f.InternalName,
                                        displayName: f.Title,
                                        sorting: f.Sortable,
                                    };
                                    if (f.InternalName.indexOf("LinkTitle") === 0 ||
                                        f.InternalName.indexOf("LinkFilename") === 0 ||
                                        f.InternalName === "LSONumber" ||
                                        f.InternalName === "Title") {
                                        field.render = ListService._getLinkRenderFunction(webUrl, listProperties, f);
                                    }
                                    listColumns.push(field);
                                }
                                break;
                        }
                    });
                    if (listProperties.Title === Constants.Lists.Tasks) {
                        if (select.indexOf("LmsTaskType") < 0) {
                            select.push("LmsTaskType");
                        }
                    }
                    if (listProperties.Title === Constants.Lists.Bills || listProperties.Title === Constants.Lists.BillDraftRequest) {
                        if (select.indexOf("LSONumber") < 0) {
                            select.push("LSONumber");
                        }
                    }
                    if (listProperties.BaseType === 1) {
                        expand.push("File");
                        select.push("File/LinkingUrl");
                        select.push("File/Name");
                        select.push("File/ServerRelativeUrl");
                    }
                    if (select.indexOf("Id") < 0 && select.indexOf("ID") < 0) {
                        select.push("Id");
                    }
                    resolve({
                        listProperties,
                        viewFields: listColumns,
                        select,
                        expand,
                        order: ListService.getRestOrderBy(viewQuery, allListFields),
                        filter: ListService.getFilterFromCaml(viewQuery, allListFields),
                    });

                }, (err) => { reject(err); });
            } else {
                resolve();
            }
        });
    }

    public static getData(webUrl: string, listId: string, filter?: string, select?: string[], expand?: string[], orderBy?: IListOrder[]): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            if (!McsUtil.isArray(select)) {
                select = [];
            }
            if (!McsUtil.isString(filter)) {
                filter = "";
            }
            if (!McsUtil.isArray(orderBy)) {
                orderBy = [{ orderBy: "ID", ascending: false }];
            }
            if (!McsUtil.isArray(expand)) {
                expand = [];
            }
            // tslint:disable-next-line:typedef
            let items = (new Web(webUrl)).lists.getById(listId).items
                .select(...select)
                .expand(...expand)
                .filter(filter);
            orderBy.forEach((o) => {
                items = items.orderBy(o.orderBy, o.ascending);
            });
            items.get()
                .then((data) => {
                    resolve(data);
                }, (err) => { reject(err); });
        });
    }

    public static getListProperties(web: Web, listTitle: string): Promise<IList> {
        const select: string[] = ["AllowContentTypes",
            "BaseTemplate",
            "BaseType",
            "ContentTypesEnabled",
            "Description",
            "DocumentTemplateUrl",
            "EnableMinorVersions",
            "EnableVersionin",
            "EntityTypeName",
            "Id",
            "Title",
            "RootFolder/IsWOPIEnabled",
            "RootFolder/Name",
            "RootFolder/ServerRelativeUrl"];
        const expand: string[] = ["RootFolder"];
        return new Promise<IList>((resolve, reject) => {
            web.lists.getByTitle(listTitle)
                .select(...select)
                .expand(...expand)
                .get()
                .then((value: IList) => {
                    resolve(value);
                }, (err) => {
                    reject(err);
                });
        });
    }

    public static getListPropertiesById(webUrl: string, listId: string): Promise<IList> {
        const select: string[] = ["AllowContentTypes",
            "BaseTemplate",
            "BaseType",
            "ContentTypesEnabled",
            "Description",
            "DocumentTemplateUrl",
            "EnableMinorVersions",
            "EnableVersionin",
            "EntityTypeName",
            "Id",
            "Title",
            "RootFolder/IsWOPIEnabled",
            "RootFolder/Name",
            "RootFolder/ServerRelativeUrl"];
        const expand: string[] = ["RootFolder"];
        return new Promise<IList>((resolve, reject) => {
            (new Web(webUrl)).lists.getById(listId)
                .select(...select)
                .expand(...expand)
                .get()
                .then((value: IList) => {
                    resolve(value);
                }, (err) => {
                    reject(err);
                });
        });
    }

    public static getListContentType(web: Web, listTitle: string, contentTypeName?: string): Promise<IContentType[]> {
        const select: string[] = ["DisplayFormUrl", "DocumentTemplate", "DocumentTemplateUrl", "StringId", "Name"];
        return new Promise<IContentType[]>((resolve, reject) => {
            if (McsUtil.isString(contentTypeName)) {
                web.lists.getByTitle(listTitle).contentTypes
                    .filter("Name eq '" + contentTypeName + "'")
                    .select(...select)
                    .get()
                    .then((value: IContentType[]) => {
                        resolve(value);
                    });
            } else {
                web.lists.getByTitle(listTitle).contentTypes
                    .select(...select)
                    .get()
                    .then((value: IContentType[]) => {
                        resolve(value);
                    });
            }
        });
    }

    public static getListFields(webUrl: string, list: string, filter?: string): Promise<IField[]> {
        return new Promise<IField[]>((resolve, reject) => {
            if (!McsUtil.isString(filter)) {
                filter = "Hidden eq false";
            }
            const select: string[] = ["InternalName", "Sortable", "Title", "TypeAsString", "IsDependentLookup", "LookupField", "PrimaryFieldId", "Id",
                "LookupList", "DependentLookupInternalNames"];
            if (McsUtil.isGuid(list)) {
                (new Web(webUrl)).lists.getById(list).fields.filter(filter)
                    .select(...select)
                    .get()
                    .then((value: IField[]) => {
                        resolve(value);
                    });
            } else {
                (new Web(webUrl)).lists.getByTitle(list).fields.filter(filter)
                    .select(...select)
                    .get()
                    .then((value: IField[]) => {
                        resolve(value);
                    });
            }

        });
    }

    public static getDraftingDesktopData(webUrl: string, listProperties: any, filter: string): Promise<Array<IListItem | IDocumentItem>> {
        return new Promise<Array<IListItem | IDocumentItem>>((resolve, reject) => {
            const web: Web = new Web(webUrl);
            let select: string[] = ["Id", "Title", "ContentType/Id", "ContentType/Name", "Modified"];
            ["Editor"].forEach((f) => {
                select = select.concat([f + "/Id", f + "/Title", f + "/EMail"]);
            });
            let expand: string[] = ["ContentType", "Editor"];
            if (listProperties.BaseTemplate === 101) {
                select = select.concat(["ServerRedirectedEmbedUrl", "File/Name", "File/UIVersionLabel", "File/LinkingUrl", "File/ServerRelativeUrl"]);
                expand = expand.concat(["File"]);
            }
            if (listProperties.Title === Constants.Lists.Tasks) {
                if (select.indexOf("LmsTaskType") < 0) {
                    select.push("LmsTaskType");
                }
            }
            if (listProperties.Title === Constants.Lists.Bills || listProperties.Title === Constants.Lists.BillDraftRequest) {
                if (select.indexOf("LSONumber") < 0) {
                    select.push("LSONumber");
                }
                if (listProperties.Title === Constants.Lists.Bills) {
                    select.push("DocumentVersion");
                }
            }
            web.lists.getById(listProperties.Id).items.filter(filter).select(...select).expand(...expand).get()
                .then((items: Array<IListItem | IDocumentItem>) => {
                    resolve(items);
                }, (err) => {
                    reject(err);
                });
        });

    }

    public static getLinkUrl(webUrl: string, listTitle: string, listId: string, item: IListItem): string {
        if (listTitle === Constants.Lists.Tasks) {
            return `${ListService._getTaskPageUrl(webUrl, item as ITasks)}?TaskId=${item.Id}&source=${encodeURIComponent(window.location.href.split("?")[0])}`;
        }
        if (listTitle === Constants.Lists.Bills) {
            return McsUtil.combinePaths(webUrl, `${Constants.Pages.DraftingDesktop}?LsoNumber=${(item as IBills).LSONumber}`);
        }
        if (listTitle === Constants.Lists.BillDraftRequest) {
            return McsUtil.combinePaths(webUrl, `${Constants.Pages.BillDraftRequest}?bdrId=${item.Id}`);
        }
        // tslint:disable-next-line:max-line-length
        const href: string = McsUtil.combinePaths(webUrl, `/_layouts/15/listform.aspx?PageType=4&ListId={${listId}}&ID=${item.Id}&RootFolder=*&source=${encodeURIComponent(window.location.href.split("?")[0])}`);
    }

    public static getMockFiscalList(): IList[] {
        const tempField: IField[] = [{ Id: "", InternalName: "" } as IField];
        return [
            {
                AllowContentTypes: false,
                BaseTemplate: 0,
                BaseType: 0,
                ContentTypesEnabled: false,
                Description: "",
                DocumentTemplateUrl: "",
                EnableMinorVersions: false,
                EnableVersionin: false,
                EntityTypeName: "",
                Id: "AD7742E6-3E17-44C2-9BFF-44C568AEAEE3",
                Title: "Fiscal Note",
                RootFolder: null,
                Fields: tempField,
            },
            {
                AllowContentTypes: false,
                BaseTemplate: 0,
                BaseType: 0,
                ContentTypesEnabled: false,
                Description: "",
                DocumentTemplateUrl: "",
                EnableMinorVersions: false,
                EnableVersionin: false,
                EntityTypeName: "",
                Id: "39E0AF92-42AD-4A93-A70B-8769E97C02C8",
                Title: "Fiscal Directive",
                RootFolder: null,
                Fields: tempField,
            },
            {
                AllowContentTypes: false,
                BaseTemplate: 0,
                BaseType: 0,
                ContentTypesEnabled: false,
                Description: "",
                DocumentTemplateUrl: "",
                EnableMinorVersions: false,
                EnableVersionin: false,
                EntityTypeName: "",
                Id: "491739D2-AB97-4BD0-BBBD-552A85BA9F13",
                Title: "Fiscal Impact",
                RootFolder: null,
                Fields: tempField,
            },
        ];
    }

    private static _getLinkRenderFunction(webUrl: string, listProperties: IList, field: IField): (item?: any, index?: number, column?: IColumn) => any {
        // tslint:disable-next-line:typedef
        const renderFunction = (item?: any, index?: number, column?: IColumn): any => {
            if (McsUtil.isDefined(item)) {
                if (field.InternalName.indexOf("LinkFilename") === 0) {
                    if (McsUtil.isWordDocument(item["File.Name"])) {
                        return React.createElement(FileNameColumn, { item, showVersion: false, listId: listProperties.Id });
                    } else {
                        return React.createElement("a", { href: item["File.LinkingUrl"], target: "_self" }, item["File.Name"]);
                    }
                }
                if (field.InternalName.indexOf("LinkTitle") === 0 || field.InternalName === "Title" || field.InternalName === "LSONumber") {
                    const linkTitleUrl: string = ListService.getLinkUrl(webUrl, listProperties.Title, listProperties.Id, item);
                    if (listProperties.Title === Constants.Lists.Tasks ||
                        listProperties.Title === Constants.Lists.Bills ||
                        listProperties.Title === Constants.Lists.BillDraftRequest) {
                        return React.createElement("a", { href: linkTitleUrl }, item[column.fieldName]);
                    }
                    return React.createElement("a",
                        {
                            href: linkTitleUrl,
                            onclick: `OpenPopUpPage('${linkTitleUrl}'); return false;`,
                        }, item[column.fieldName]);
                }
            }
            return "";
        };
        return renderFunction;
    }

    private static _getRestFilter(xml: Element, allListFields: IField[]): string {
        const name: string = xml.nodeName;
        // if logical joins
        if (/and/gi.test(name) || /or/gi.test(name)) {
            const firstChild: any = xml.childNodes[0];
            const lastChild: any = xml.childNodes[1];
            return `${this._getRestFilter(firstChild, allListFields)} ${name.toLowerCase()} ${this._getRestFilter(lastChild, allListFields)}`;
        }
        const fieldRef: Element = xml.firstElementChild;
        const fieldName: string = fieldRef.getAttribute("Name");
        if (/BeginsWith/gi.test(name)) {
            const fieldValue: Element = fieldRef.nextElementSibling;
            return `startswith('${fieldValue.nodeValue}',${fieldName})`;
        }
        if (/Contains/gi.test(name)) {
            const fieldValue: Element = fieldRef.nextElementSibling;
            return `substringof('${fieldValue.nodeValue}',${fieldName})`;
        }
        if (/Eq/gi.test(name) || /Geq/gi.test(name) || /Gt/gi.test(name) || /Leq/gi.test(name) || /Lt/gi.test(name) || /Neq/gi.test(name)) {
            const fieldValue: Element = fieldRef.nextElementSibling;
            const type: string = fieldValue.getAttribute("Type");
            let restOperator: string = "";
            switch (name.toLowerCase()) {
                case "eq": restOperator = "eq"; break;
                case "geq": restOperator = "ge"; break;
                case "gt": restOperator = "gt"; break;
                case "leq": restOperator = "le"; break;
                case "lt": restOperator = "lt"; break;
                case "neq": restOperator = "ne"; break;
                default: restOperator = "eq"; break;
            }
            if (/Counter/gi.test(type) || /Number/gi.test(type) || /Boolean/gi.test(type) || /Integer/gi.test(type)) {
                if (/Integer/gi.test(type)) {
                    const fieldFilter: IField[] = allListFields.filter((f) => f.InternalName === fieldName);
                    if (fieldFilter.length > 0 && fieldFilter[0].TypeAsString === "User") {
                        return `${fieldName}Id ${restOperator} ${fieldValue.innerHTML}`;
                    }
                }
                return `${fieldName} ${restOperator} ${fieldValue.innerHTML}`;
            }
            if (/DateTime/gi.test(type)) {
                if (/today/gi.test(fieldValue.innerHTML)) {
                    return `${fieldName} ${restOperator} '${(new Date()).toISOString()}'`;
                }
                return `${fieldName} ${restOperator} '${(new Date()).toISOString()}'`;
            }
            return `${fieldName} ${restOperator} '${fieldValue.innerHTML}'`;
        }
        if (/IsNull/gi.test(name)) {
            return `${fieldName} eq null`;
        }
        if (/IsNotNull/gi.test(name)) {
            return `${fieldName} ne null`;
        }
        return "";
    }

    private static _getTaskPageUrl(webUrl: string, item: ITasks): string {
        if (McsUtil.isString(item.LmsTaskType)) {
            const re: RegExp = new RegExp(item.LmsTaskType, "gi");
            if (re.test("Bill Processing Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.BillProcessingTask);
            }
            if (re.test("Bill Tracking Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.BillTrackingTask);
            }
            if (re.test("Create Session Law Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.CreateSessionLawTask);
            }
            if (re.test("Create Numbered Bill Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.CreateNumberedBillTask);
            }
            if (re.test("Assign Chapter Number Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.AssignChapterNumber);
            }
            if (re.test("Assign Enroll Number Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.AssignEnrollNumber);
            }
            if (re.test("Create Formal Draft Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.CreateFormalDraftTask);
            }
            if (re.test("Assign Fiscal Analyst Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.AssignFiscalAnalystTask);
            }
            if (re.test("Create Engrossed Bill Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.CreateEngrossedBillTask);
            }
            if (re.test("Assign Drafter Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.AssignDrafterTask);
            }
            if (re.test("Fiscal Impact Request Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.AssignFiscalAnalystTask);
            }
            if (re.test("Jcc Assignment Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.JccAssignment);
            }
            if (re.test("Bill Introduction Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.BillIntroductionTask);
            }
            if (re.test("Update Database Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.UpdateDatabaseTask);
            }
            if (re.test("Obtain Sponsor Approval Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.SponsorApprovalTask);
            }
            if (re.test("Create Bill Summary Task")) {
                return McsUtil.combinePaths(webUrl, Constants.Pages.BillProcessingTask);
            }
        }
        return McsUtil.combinePaths(webUrl, "SitePages/Bill Processing Task.aspx");
    }
}
