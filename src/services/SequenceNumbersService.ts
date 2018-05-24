import { IListApi, ISequenceNumbers, apiHelper, Constants, lmsLogger } from "mcs-lms-core";

export class SequenceNumbersService {
    private _serviceApi: IListApi<ISequenceNumbers>;

    constructor(private isLocalEnvironment: boolean) {
        this._serviceApi = apiHelper.getSequenceNumberApi(isLocalEnvironment);
    }

    public getNextSequenceNumber(type: Constants.SequenceNumberType): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this._serviceApi.getListItems(this._getFilter(type))
                .then((result: ISequenceNumbers[]) => {
                    if (result.length < 1) {
                        reject("Unable to find sequence type");
                    } else {
                        const nextNumber: number = result[0].SequenceNextNumber;
                        this._serviceApi.updateItem(result[0].Id, result[0]["odata.type"], {
                            SequenceNextNumber: nextNumber + 1,
                        }).then(() => {
                            resolve(nextNumber);
                        }, (err) => {
                            reject(err);
                        });
                    }
                });
        });
    }

    public setNextSequenceNumber(type: Constants.SequenceNumberType, nextNumber: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._serviceApi.getListItems(this._getFilter(type))
                .then((result: ISequenceNumbers[]) => {
                    if (result.length < 1) {
                        reject("Unable to find sequence type");
                    } else {
                        this._serviceApi.updateItem(result[0].Id, result[0]["odata.type"], {
                            SequenceNextNumber: nextNumber,
                        }).then(() => {
                            resolve(true);
                        }, (err) => {
                            reject(false);
                        });
                    }
                });
        });
    }

    public getBillNumberSequenceType(houseOfOrigin: string, billType: string): Constants.SequenceNumberType {
        lmsLogger.writeInfo("Getting sequence number type.");
        if (/senate/gi.test(houseOfOrigin)) {
            if (/bill/gi.test(billType)) {
                return Constants.SequenceNumberType.SenateBillNumber;
            }
            return Constants.SequenceNumberType.SenateResolutionNumber;
        }
        if (/bill/gi.test(billType)) {
            return Constants.SequenceNumberType.HouseBillNumber;
        }
        return Constants.SequenceNumberType.HouseResolutionNumber;
    }

    private _getFilter(type: Constants.SequenceNumberType): string {
        switch (type) {
            case Constants.SequenceNumberType.BillMessageNumber:
                return "Title eq 'Bill Message Number'";
            case Constants.SequenceNumberType.HouseBillMessage:
                return "Title eq 'House Bill Message'";
            case Constants.SequenceNumberType.HouseBillNumber:
                return "Title eq 'House Bill Number'";
            case Constants.SequenceNumberType.HouseEnrolledNumber:
                return "Title eq 'House Enrolled Number'";
            case Constants.SequenceNumberType.HouseResolutionNumber:
                return "Title eq 'House Resolution Number'";
            case Constants.SequenceNumberType.LsoNumber:
                return "Title eq 'Lso Number'";
            case Constants.SequenceNumberType.SenateBillMessage:
                return "Title eq 'Senate Bill Message'";
            case Constants.SequenceNumberType.SenateBillNumber:
                return "Title eq 'Senate Bill Number'";
            case Constants.SequenceNumberType.SenateEnrolledNumber:
                return "Title eq 'Senate Enrolled Number'";
            case Constants.SequenceNumberType.SenateResolutionNumber:
                return "Title eq 'Senate Resolution Number'";
            default:
                return "Title eq 'unknown'";
        }

    }
}
