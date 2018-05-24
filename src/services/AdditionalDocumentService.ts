import { IContentType, IBills, IAdditionalDocuments, McsUtil,  apiHelper, Constants, IDocumentLibraryApi } from "mcs-lms-core";
import { ListService } from "./ListService";

export enum DocumentType {
    BillSummary,
    FiscalNote,
    // FiscalNoteNoImpact,
    WaiverOfPrivilege,
    Document,
}

export class AdditionalDocumentService {
    private _serviceAdditionalApi: IDocumentLibraryApi;
    private _listContentTypes: IContentType[];

    constructor() {
        this._serviceAdditionalApi = apiHelper.getDocumentLibraryApi(Constants.Lists.AdditionalDocument);
        ListService.getListContentType(this._serviceAdditionalApi.getWeb(), Constants.Lists.AdditionalDocument)
            .then((properties) => {
                this._listContentTypes = properties;
            });
    }

    public addOrUpdateDocument(filename: string, documentType: DocumentType, bill: IBills, blob: Blob): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const documentProperties: any = this._getDocumentPropeties(documentType, bill);
            if (!McsUtil.isString(filename)) {
                filename = this._getFilename(documentType, bill);
            }
            this._serviceAdditionalApi.addOrUpdateDocument(filename, documentProperties, blob)
                .then(() => {
                    resolve();
                }, (err) => reject(err));
        });
    }

    private _getDocumentPropeties(documentType: DocumentType, bill: IBills): IAdditionalDocuments {
        let contentTypeName: string = "Documents";
        switch (documentType) {
            case DocumentType.BillSummary: contentTypeName = "Bill Summary"; break;
            case DocumentType.FiscalNote: contentTypeName = "Fiscal Note"; break;
            // case DocumentType.FiscalNoteNoImpact: contentTypeName = "Fiscal Note No Impact"; break;
            case DocumentType.WaiverOfPrivilege: contentTypeName = "Waiver of Privilege"; break;
            default: break;
        }
        const contentType: IContentType = this._listContentTypes.filter((f) => f.Name === contentTypeName)[0];
        return {
            BillLookupId: bill.Id,
            BillEffectiveDate_RO: bill.BillEffectiveDate as string,
            BillNumber_RO: bill.BillNumber,
            CatchTitle_RO: bill.CatchTitle,
            ChapterNumber_RO: bill.ChapterNumber,
            Drafter_RO: bill.Drafter.Title,
            EnrolledNumber_RO: bill.EnrolledNumber,
            ContentTypeId: contentType.StringId,
            LSONumber_RO: bill.LSONumber,
            Sponsor_RO: bill.Sponsor,
            Title: `${contentType.Name} - ${bill.LSONumber}`,
        };
    }

    private _getFilename(documentType: DocumentType, bill: IBills): string {
        let contentTypeName: string = "Documents";
        switch (documentType) {
            case DocumentType.BillSummary: contentTypeName = "Bill Summary"; break;
            case DocumentType.FiscalNote: contentTypeName = "Fiscal Note"; break;
            // case DocumentType.FiscalNoteNoImpact: contentTypeName = "Fiscal Note No Impact"; break;
            case DocumentType.WaiverOfPrivilege: contentTypeName = "Waiver of Privilege"; break;
            default: break;
        }
        return `${contentTypeName} - ${bill.LSONumber}.docx`;
    }
}