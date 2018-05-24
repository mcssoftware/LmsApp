import React = require("react");
import styles from "./FiscalNoteForm.module.scss";
import {
    autobind,
    Dropdown, IDropdownOption,
    ActionButton,
    TextField,
    Checkbox,
    Label,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import {
    INonAdminAnticipatedExpenditure, INonAdminAnticipatedRevenue, IAppropriationsAgency, IAppropriationsAgenciesFund,
    IAppropriationsAgenciesSery, IFiscalNoteYear,
} from "./IFiscalNoteForm";
import { AgencyFundControl } from "./AgencyFundControl";
import { McsUtil } from "mcs-lms-core";
import { AgencySeryControl } from "./AgencySeryControl";

export interface IAppropriationAgencyProps {
    appropriationAgency: IAppropriationsAgency;
    index: number;
    agencyList: IDropdownOption[];
    fundList: IDropdownOption[];
    seriesList: IDropdownOption[];
    currentYear: IFiscalNoteYear;
    onChanged?: (value: IAppropriationsAgency, index: number) => void;
    remove?: (index: number) => void;
}

export interface IAppropriationAgencyState {
    data: IAppropriationsAgency;
}

export class AppropriationAgencyControl extends React.Component<IAppropriationAgencyProps, IAppropriationAgencyState> {
    constructor(props: IAppropriationAgencyProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.appropriationAgency),
        };
    }

    public render(): React.ReactElement<IAppropriationAgencyProps> {
        const { data } = this.state;
        const { agencyList, fundList, seriesList, currentYear } = this.props;
        return (
            <div className={styles.row}>
                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}><ActionButton className={styles.btnDeleteLegend} data-automation-id="removeAppropriation"
                        iconProps={{ iconName: "Sub" }} onClick={this._removeAppropriation}>Remove</ActionButton></legend>
                    <div className={styles.row}>
                        <div className={styles.column6}>
                            <Dropdown placeHolder=""
                                label="Agency"
                                selectedKey={data.AppropriationsAgencyName}
                                required={true}
                                options={agencyList}
                                onChanged={this._agencySelected} />
                        </div>
                        <div className={styles.column6}>
                            <TextField label="Unit" value={data.AppropriationsUnit} onChanged={this._unitChanged} />
                        </div>
                    </div>
                    <div className={styles.row}>
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.legend}>Appropriations to the Agency</legend>
                            <div className={styles.row + " " + styles.backgroundColor}>
                                <div className={styles.column5}>
                                    <Label>Fund</Label>
                                </div>
                                <div className={styles.column3}>
                                    <Label>Amount</Label>
                                </div>
                                <div className={styles.column2}>
                                    <Label>Effective Immediately</Label>
                                </div>
                                <div className={styles.column2}>
                                </div>
                            </div>
                            {data.AppropriationsAgenciesFunds && data.AppropriationsAgenciesFunds.length > 0 &&
                                data.AppropriationsAgenciesFunds.map((fund, index) => {
                                    return <AgencyFundControl
                                        remove={this._removeAgencyFund}
                                        agencyFund={fund}
                                        fundList={fundList}
                                        index={index}
                                        onChanged={this._fundChanged} />;
                                })
                            }
                            <div className={styles.row + " " + styles.borderedTop}>
                                <div className={styles.column12}>
                                    <ActionButton data-automation-id="insertAgencyFund"
                                        iconProps={{ iconName: "Add" }} onClick={this._insertAgencyFund}>Insert appropriation</ActionButton>
                                </div>
                            </div>
                        </fieldset>
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.legend}>Series Allocations by the Agency</legend>
                            <div className={styles.row + " " + styles.backgroundColor}>
                                <div className={styles.column4}>
                                    <Label>Series</Label>
                                </div>
                                <div className={styles.column2}>
                                    <Label>FY{currentYear.SeriesYearDisplay1}</Label>
                                </div>
                                <div className={styles.column2}>
                                    <Label>FY{currentYear.SeriesYearDisplay2}</Label>
                                </div>
                                <div className={styles.column2}>
                                    <Label>FY{currentYear.SeriesYearDisplay3}</Label>
                                </div>
                                <div className={styles.column2}>
                                </div>
                            </div>
                            {data.AppropriationsAgenciesSeries && data.AppropriationsAgenciesSeries.length > 0 &&
                                data.AppropriationsAgenciesSeries.map((series, index) => {
                                    return <AgencySeryControl
                                        remove={this._removeSery}
                                        agencySeries={series}
                                        index={index}
                                        seriesList={seriesList}
                                        onChanged={this._seryChanged} />;
                                })
                            }
                            <div className={styles.row + " " + styles.borderedTop}>
                                <div className={styles.column12}>
                                    <ActionButton data-automation-id="insertAgencySery"
                                        iconProps={{ iconName: "Add" }} onClick={this._insertAgencySery}>Insert series</ActionButton>
                                </div>
                            </div>
                        </fieldset>
                    </div >
                </fieldset >
            </div>
        );
    }

    @autobind
    private _insertAgencyFund(): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        if (!McsUtil.isArray(data.AppropriationsAgenciesFunds)) {
            data.AppropriationsAgenciesFunds = [];
        }
        data.AppropriationsAgenciesFunds.push({
            Id: 0,
            AppropriationsFund: "",
            AppropriationsFundDescription: "",
            AppropriationsAmount: 0,
            AppropriationsEffImm: false,
            FiscalNoteId: this._handleNumber(this.props.appropriationAgency.FiscalNoteId),
            AppropriationsAgenciesId: 0,
        });
        this.setState({
            ...this.state,
            data,
        });
    }

    @autobind
    private _insertAgencySery(): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        if (!McsUtil.isArray(data.AppropriationsAgenciesSeries)) {
            data.AppropriationsAgenciesSeries = [];
        }
        data.AppropriationsAgenciesSeries.push({
            AppropriationSeries: "",
            AppropriationsSeriesName: "",
            AppropriationSeriesY1: 0,
            AppropriationSeriesY2: 0,
            AppropriationSeriesY3: 0,
            FiscalNoteId: this._handleNumber(this.props.appropriationAgency.FiscalNoteId),
            AppropriationsAgenciesId: data.Id,
        } as IAppropriationsAgenciesSery);
        this.setState({
            ...this.state,
            data,
        });
    }

    @autobind
    private _agencySelected(option: IDropdownOption, index?: number): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        if (index > 0 && McsUtil.isString(option.key)) {
            data.AppropriationsAgencyName = option.key as string;
        }
        this._setState(data);
    }

    @autobind
    private _unitChanged(value: string): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        data.AppropriationsUnit = value;
        this._setState(data);
    }

    @autobind
    private _fundChanged(value: IAppropriationsAgenciesFund, index: number): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        data.AppropriationsAgenciesFunds[index] = value;
        this._setState(data);
    }

    @autobind
    private _removeAgencyFund(index: number): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        data.AppropriationsAgenciesFunds.splice(index, 1);
        this._setState(data);
    }

    @autobind
    private _seryChanged(value: IAppropriationsAgenciesSery, index: number): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        data.AppropriationsAgenciesSeries[index] = value;
        this._setState(data);
    }

    @autobind
    private _removeAppropriation(): void {
        this.props.remove(this.props.index);
    }

    @autobind
    private _removeSery(index: number): void {
        const data: IAppropriationsAgency = clone(this.state.data);
        data.AppropriationsAgenciesSeries.splice(index, 1);
        this._setState(data);
    }

    private _setState(data: IAppropriationsAgency): void {
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }

    private _handleNumber(value: any): number {
        return McsUtil.isNumberString(value as string) ? parseInt(value as string, 10) : 0;
    }
}