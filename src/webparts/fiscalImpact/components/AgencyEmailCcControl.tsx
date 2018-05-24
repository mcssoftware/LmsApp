import React = require("react");
import styles from "./FiscalImpact.module.scss";
import {
    TextField,
    ActionButton,
    Dropdown, IDropdownOption,
    autobind,
} from "office-ui-fabric-react";
import { IFiscalImpactAgencyCC } from "./IFiscalImpactForm";
import { clone } from "@microsoft/sp-lodash-subset";
import { McsUtil, IAgencyContact } from "mcs-lms-core";

export interface IAgencyEmailCcControlProps {
    agencyCc: IFiscalImpactAgencyCC;
    index: number;
    agencyList: IAgencyContact[];
    removeCC?: (index: number) => void;
    onChanged: (data: IFiscalImpactAgencyCC, index: number) => void;
}

export interface IAgencyEmailCcControlState {
    data: IFiscalImpactAgencyCC;
}

export class AgencyEmailCcControl extends React.Component<IAgencyEmailCcControlProps, IAgencyEmailCcControlState> {
    constructor(props: IAgencyEmailCcControlProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.agencyCc),
        };
    }

    public render(): React.ReactElement<IAgencyEmailCcControlProps> {
        const { data } = this.state;
        return (
            <fieldset className={styles.fieldset}>
                <div className={styles.row}>
                    <legend className={styles.legend}>CC Email Address(es) for Board of Registration in Podiatry:<ActionButton className={styles.btnDeleteLegend}
                        iconProps={{ iconName: "Sub" }} onClick={this._removeCC}>Remove</ActionButton></legend>
                    <div className={styles.row}>
                        <div className={styles.column12}>
                            <div className={styles.column6}>
                                <Dropdown label="Contact Name:"
                                    options={this._getAgencyDropDown()}
                                    selectedKey={data.CCContactName}
                                    onChanged={this._contactNameChanged} />
                            </div>

                            <div className={styles.column6}>
                                <TextField
                                    className={styles.fieldpadding}
                                    label="Contact Email:"
                                    value={data.CCEmailAddr}
                                    resizable={false}
                                    onChanged={this._contactEmailChanged} />
                            </div>
                        </div>
                    </div>
                </div>
            </fieldset>
        );
    }

    private _getAgencyDropDown(): IDropdownOption[] {
        return [{ key: "", text: "Select an agency" } as IDropdownOption].concat(this.props.agencyList.map((f) => {
            return { key: f.AgencyContactName, text: f.AgencyContactName } as IDropdownOption;
        }));
    }

    @autobind
    private _contactNameChanged(option: IDropdownOption, index?: number): void {
        const data: IFiscalImpactAgencyCC = clone(this.state.data);
        if (index > 0) {
            const agency: IAgencyContact = this.props.agencyList[index - 1];
            data.CCContactName = agency.AgencyContactName;
            data.CCEmailAddr = agency.EMail;
        } else {
            data.CCContactName = "";
            data.CCEmailAddr = "";
        }
        this._setState(data);
    }

    @autobind
    private _contactEmailChanged(value: string): void {
        const data: IFiscalImpactAgencyCC = clone(this.state.data);
        data.CCEmailAddr = value;
        this._setState(data);
    }

    @autobind
    private _removeCC(): void {
        this.props.removeCC(this.props.index);
    }

    private _setState(data: IFiscalImpactAgencyCC): void {
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }
}