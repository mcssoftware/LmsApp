import { ITasks, IBills, LmsFormatters, Constants } from "mcs-lms-core";
import { SequenceNumbersService } from "./SequenceNumbersService";

export class BillNumberingTaskService {
    /**
     *
     */
    constructor(private isLocalEnvironment: boolean, private _bill: IBills, private _task: ITasks) {
    }

    private _getBillNumber(numberingType: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let billPrefix: string;
            if (this._bill.LegislationType !== "Bill") {
                billPrefix = /house/gi.test(this._bill.HouseofOrigin) ? "HJ" : "SJ";
            } else {
                billPrefix = /house/gi.test(this._bill.HouseofOrigin) ? "HB" : "SF";
            }
            let sequenceNumber: number = 0;
            if (numberingType === "Budget Bill") {
                sequenceNumber = 1;
            }
            if (numberingType === "") {
                sequenceNumber = 2;
            }
            if (sequenceNumber > 0) {
                LmsFormatters.LsoOrBillNumber(billPrefix + sequenceNumber.toString(), null)
                    .then((value) => {
                        resolve(value);
                    });
            } else {
                let sequenceNumberType: Constants.SequenceNumberType = Constants.SequenceNumberType.HouseBillNumber;
                switch (billPrefix) {
                    case "SF":
                        sequenceNumberType = Constants.SequenceNumberType.SenateBillNumber;
                        break;
                    case "HJ":
                        sequenceNumberType = Constants.SequenceNumberType.HouseResolutionNumber;
                        break;
                    case "SJ":
                        sequenceNumberType = Constants.SequenceNumberType.SenateResolutionNumber;
                        break;
                }
                const sequenceNumberService: SequenceNumbersService = new SequenceNumbersService(this.isLocalEnvironment);
                sequenceNumberService.getNextSequenceNumber(sequenceNumberType)
                    .then((newSequenceNumber: number) => {
                        LmsFormatters.LsoOrBillNumber(billPrefix + newSequenceNumber.toString(), null)
                            .then((value) => {
                                resolve(value);
                            });
                    });
            }
        });
    }
}
