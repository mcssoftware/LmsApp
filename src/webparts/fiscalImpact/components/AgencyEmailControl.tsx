import React = require("react");
import styles from "./FiscalImpact.module.scss";
import {
    autobind,
    TextField,
    ActionButton,
    Dropdown, IDropdownOption,
} from "office-ui-fabric-react";
import { AgencyEmailCcControl } from "./AgencyEmailCcControl";
import { IFiscalImpactAgencyInfo, IFiscalImpactAgencyCC } from "./IFiscalImpactForm";
import { clone } from "@microsoft/sp-lodash-subset";
import { McsUtil, IAgencyContact } from "mcs-lms-core";

export interface IAgencyEmailControlProps {
    agencyInfo: IFiscalImpactAgencyInfo;
    removeInfo?: (index: number) => void;
    index: number;
    agencyList: IAgencyContact[];
    onChanged?: (data: IFiscalImpactAgencyInfo, index: number) => void;
}

export interface IAgencyEmailControlState {
    data: IFiscalImpactAgencyInfo;
    directorAgencyid: number;
}

export class AgencyEmailControl extends React.Component<IAgencyEmailControlProps, IAgencyEmailControlState> {
    constructor(props: IAgencyEmailControlProps, context?: any) {
        super(props);
        let directorAgencyid: number = 0;
        if (McsUtil.isDefined(props.agencyInfo) && McsUtil.isDefined(props.agencyInfo.AgencyCode)) {
            // tslint:disable-next-line:prefer-for-of
            for (let i: number = 0; i < props.agencyList.length; i++) {
                const agency: IAgencyContact = props.agencyList[i];
                if (agency.Title === props.agencyInfo.AgencyCode) {
                    directorAgencyid = agency.Id;
                    break;
                }
            }
        }
        this.state = {
            data: clone(props.agencyInfo),
            directorAgencyid,
        };
    }

    public render(): React.ReactElement<IAgencyEmailControlProps> {
        const { data } = this.state;
        return (
            <fieldset className={styles.fieldset}>
                <div className={styles.row}>
                    <fieldset className={styles.fieldset}>
                        <legend className={styles.legend}>Agency Email Address:   <ActionButton className={styles.btnDeleteLegend}
                            iconProps={{ iconName: "Sub" }} onClick={this._removeEmail}>Remove</ActionButton>
                        </legend>
                        <div className={styles.row}>
                            <div className={styles.column12}>
                                <div className={styles.column4}>
                                    <Dropdown label="Agency Name:"
                                        options={this._getAgencies()}
                                        selectedKey={this.state.directorAgencyid}
                                        onChanged={this._agencyCodeChanged} />
                                </div>
                                <div className={styles.column4}>
                                    <TextField
                                        className={styles.fieldpadding}
                                        label="Director:"
                                        value={data.DirectorName}
                                        resizable={false}
                                        onChanged={this._agencyDirectorChanged} />
                                </div>
                                <div className={styles.column4}>
                                    <TextField
                                        className={styles.fieldpadding}
                                        label="Email:"
                                        value={data.DirectorEmail}
                                        resizable={false}
                                        onChanged={this._agencyEmailChanged} />
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    {data.FiscalImpactAgencyCCs && data.FiscalImpactAgencyCCs.length > 0 &&
                        data.FiscalImpactAgencyCCs.map((email, index) => {
                            return <AgencyEmailCcControl
                                removeCC={this._removeCC}
                                agencyCc={email}
                                index={index}
                                agencyList={this._getCCAgencies()}
                                onChanged={this._ccsChanged} />;
                        })}
                    <div className={styles.column12}>
                        <ActionButton data-automation-id="insertCC" iconProps={{ iconName: "Add" }} onClick={this._insertCC}>Insert CC(s)</ActionButton>
                    </div>
                </div>
            </fieldset>
        );
    }

    @autobind
    private _insertCC(): void {
        const data: IFiscalImpactAgencyInfo = clone(this.state.data);
        if (!McsUtil.isArray(data.FiscalImpactAgencyCCs)) {
            data.FiscalImpactAgencyCCs = [];
        }
        data.FiscalImpactAgencyCCs.push({
            FiscalImpactId: this._handleNumber(data.FiscalImpactId),
            AgencyInfoId: this._handleNumber(data.Id),
            CCContactName: "",
            CCEmailAddr: "",
        } as IFiscalImpactAgencyCC);
        this.setState({
            ...this.state,
            data,
        });
    }

    @autobind
    private _removeCC(index: number): void {
        const data: IFiscalImpactAgencyInfo = clone(this.state.data);
        data.FiscalImpactAgencyCCs.splice(index, 1);
        this._setState(data);
    }

    @autobind
    private _agencyCodeChanged(option: IDropdownOption, index?: number): void {
        const data: IFiscalImpactAgencyInfo = clone(this.state.data);
        let directorAgencyid: number = 0;
        if (index > 0) {
            const selectedKey: number = option.key as number;
            for (let i: number = index; i < this.props.agencyList.length; i++) {
                if (this.props.agencyList[i].Id === selectedKey) {
                    const agency: IAgencyContact = this.props.agencyList[i];
                    data.AgencyCode = agency.Title;
                    data.AgencyName = agency.AgencyName;
                    data.DirectorEmail = agency.EMail;
                    data.DirectorName = agency.AgencyContactName;
                    directorAgencyid = agency.Id;
                    data.FiscalImpactAgencyCCs = [];
                    break;
                }
            }
        } else {
            data.AgencyCode = data.AgencyName = data.DirectorEmail = data.DirectorName = "";
        }
        this._setState(data, directorAgencyid);
    }

    @autobind
    private _agencyDirectorChanged(value: string): void {
        const data: IFiscalImpactAgencyInfo = clone(this.state.data);
        data.DirectorName = value;
        this._setState(data);
    }

    @autobind
    private _agencyEmailChanged(value: string): void {
        const data: IFiscalImpactAgencyInfo = clone(this.state.data);
        data.DirectorEmail = value;
        this._setState(data);
    }

    @autobind
    private _ccsChanged(value: IFiscalImpactAgencyCC, index: number): void {
        const data: IFiscalImpactAgencyInfo = clone(this.state.data);
        data.FiscalImpactAgencyCCs[index] = value;
        this._setState(data);
    }

    @autobind
    private _removeEmail(): void {
        this.props.removeInfo(this.props.index);
    }

    private _getAgencies(): IDropdownOption[] {
        const temp: IDropdownOption[] = this.props.agencyList.filter((f) => f.IsAgencyDirector).map((f) => {
            return { key: f.Id, text: f.AgencyName } as IDropdownOption;
        });
        return [{ key: 0, text: "Select an agency" } as IDropdownOption].concat(temp);
    }

    private _getCCAgencies(): IAgencyContact[] {
        if (this.state.data && McsUtil.isString(this.state.data.AgencyCode)) {
            return this.props.agencyList.filter((f) => f.Title === this.state.data.AgencyCode && f.EMail !== this.state.data.DirectorEmail);
        }
        return [];
    }

    private _setState(data: IFiscalImpactAgencyInfo, agencyId?: number): void {
        this.props.onChanged(data, this.props.index);
        let directorAgencyid: number = clone(this.state.directorAgencyid);
        if (McsUtil.isDefined(agencyId)) {
            directorAgencyid = agencyId;
        }
        this.setState({ ...this.state, data, directorAgencyid });
    }

    private _handleNumber(value: any): number {
        return McsUtil.isNumberString(value as string) ? parseInt(value as string, 10) : 0;
    }
}