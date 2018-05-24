import { ILegislatorsApi, ICommitteesApi, apiHelper, ILegislator, ICommittee, Constants, McsUtil, ILmsConfigurationApi } from "mcs-lms-core";

export class SponsorService {
    private static _separator: string = "#;";
    private _legislatorApi: ILegislatorsApi;
    private _committeeApi: ICommitteesApi;
    private _configurationApi: ILmsConfigurationApi;
    private _sponsorExpression: RegExp = /^(Senator|Representative)\s+/gi;

    constructor(private isLocalEnvironment: boolean) {
        this._legislatorApi = apiHelper.getLegislatorApi(isLocalEnvironment);
        this._committeeApi = apiHelper.getCommitteeApi(isLocalEnvironment);
        this._configurationApi = apiHelper.getConfigurationApi(isLocalEnvironment);
    }

    public getLegislator(year?: number): Promise<ILegislator[]> {
        return new Promise<ILegislator[]>((resolve, reject) => {
            this._configurationApi.getYear(year)
                .then((result: number) => {
                    this._legislatorApi.getLegislators(result).then((legislators: ILegislator[]) => {
                        resolve(legislators);
                    }, (err) => { reject(err); });
                });
        });
    }

    public getCommittee(year?: number): Promise<ICommittee[]> {
        return new Promise<ICommittee[]>((resolve, reject) => {
            this._configurationApi.getYear(year)
                .then((result: number) => {
                    this._committeeApi.getCommittees(result).then((committees: ICommittee[]) => {
                        resolve(committees);
                    }, (err) => { reject(err); });
                });
        });
    }

    public getSelectedSponsor(sponsorType: Constants.SponsorType, selected: string): Promise<ILegislator | ICommittee> {
        if (sponsorType === Constants.SponsorType.Committee) {
            return this.getSelectedCommittee(selected);
        } else {
            return this.getSelectedLegislator(selected);
        }
    }

    // public getSelectedRequestor(sponsorType: string, selected: string): Promise<ILegislator | ICommittee> {
    //     if (sponsorType === Constants.SponsorType[Constants.SponsorType.Committee]) {
    //         return this.getSelectedCommittee(selected);
    //     } else {
    //         return this.getSelectedLegislator(selected);
    //     }
    // }

    public getSelectedCoSponsor(sponsorType: string, selected: string): Promise<ILegislator[] | ICommittee> {
        if (sponsorType === Constants.SponsorType[Constants.SponsorType.Committee]) {
            return this.getSelectedCommittee(selected);
        } else {
            return this.getMultipleSelectedLegislators(selected);
        }
    }

    public getSelectedLegislator(selectedLegislator: string, year?: number): Promise<ILegislator> {
        return new Promise<ILegislator>((resolve, reject) => {
            this.getLegislator(year).then((legislators: ILegislator[]) => {
                const filterResult: ILegislator[] = legislators.filter((l) =>
                    this._getDisplayTest(l, false) === selectedLegislator);
                if (filterResult.length < 1) {
                    resolve(null);
                } else {
                    resolve(filterResult[0]);
                }
            }, (err) => { reject(err); });
        });
    }

    public getMultipleSelectedLegislators(selectedLegislators: string, year?: number): Promise<ILegislator[]> {
        return new Promise<ILegislator[]>((resolve, reject) => {
            this.getLegislator(year).then((legislators: ILegislator[]) => {
                const tempValue: ILegislator[] = [];
                selectedLegislators.split(SponsorService._separator).forEach((value, index) => {
                    legislators.filter((l) =>
                        this._getDisplayTest(l, true) === value).forEach((v) => {
                            tempValue.push(v);
                        });
                });
                if (tempValue.length > 0) {
                    resolve(tempValue);
                } else {
                    resolve(null);
                }
            }, (err) => { reject(err); });
        });
    }

    public getSelectedCommittee(selectedCommittee: string, year?: number): Promise<ICommittee> {
        return new Promise<ICommittee>((resolve, reject) => {
            this.getCommittee(year).then((committees: ICommittee[]) => {
                const filterResult: ICommittee[] = committees.filter((l) => l.CommitteeDisplayTitle === selectedCommittee || (l.Title === selectedCommittee));
                if (filterResult.length < 1) {
                    resolve(null);
                } else {
                    resolve(filterResult[0]);
                }
            }, (err) => { reject(err); });
        });
    }

    public getLegislatorText(selectedLegislator: ILegislator[], isMultipleSelection: boolean): string {
        if (McsUtil.isArray(selectedLegislator) && selectedLegislator.length > 0) {
            return isMultipleSelection ? selectedLegislator
                .map((v) => this._getDisplayTest(v, isMultipleSelection)).sort().join(SponsorService._separator) :
                this._getDisplayTest(selectedLegislator[0], isMultipleSelection);
        }
        return "";
    }

    public getCommitteeText(selectedCommittee: ICommittee[], isMultipleSelection: boolean): string {
        if (McsUtil.isArray(selectedCommittee) && selectedCommittee.length > 0) {
            return isMultipleSelection ? selectedCommittee.map((v) => v.Title).sort().join(SponsorService._separator) :
                (McsUtil.isDefined(selectedCommittee[0]) ?
                    (McsUtil.isString(selectedCommittee[0].CommitteeDisplayTitle) ? selectedCommittee[0].CommitteeDisplayTitle : selectedCommittee[0].Title)
                    : "");
        }
        return "";
    }

    private _getDisplayTest(legislator: ILegislator, ismultiselect: boolean): string {
        if (McsUtil.isDefined(legislator)) {
            return ismultiselect ?
                ((/^Senate/i.test(legislator.Chamber) ? "Senator" : "Representative") + " " + legislator.LegislatureDisplayName)
                : legislator.LegislatureDisplayName;
        }
        return "";
    }
}