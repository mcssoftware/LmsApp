import React = require("react");
import styles from "./FiscalNoteForm.module.scss";
import {
    autobind,
    Dropdown, IDropdownOption,
    ActionButton,
    TextField,
    Checkbox,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import { INonAdminAnticipatedExpenditure, IAppropriationsAgenciesFund } from "./IFiscalNoteForm";
import { McsUtil } from "mcs-lms-core";

export interface IAgencyFundProps {
    agencyFund: IAppropriationsAgenciesFund;
    index: number;
    fundList: IDropdownOption[];
    onChanged?: (value: IAppropriationsAgenciesFund, index: number) => void;
    remove?: (index: number) => void;
}

export interface IAgencyFundState {
    data: IAppropriationsAgenciesFund;
}

export class AgencyFundControl extends React.Component<IAgencyFundProps, IAgencyFundState> {
    constructor(props: IAgencyFundProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.agencyFund),
        };
    }

    public render(): React.ReactElement<IAgencyFundProps> {
        const { data } = this.state;
        return (
            <div className={styles.row}>
                <div className={styles.column5}>
                    <Dropdown required={true} selectedKey={data.AppropriationsFund}
                        options={this.props.fundList} onChanged={this._fundSelected} />
                </div>
                <div className={styles.column3}>
                    <TextField value={data.AppropriationsAmount.toString()} onChanged={this._amountChanged} />
                </div>
                <div className={styles.column2}>
                    <Checkbox checked={data.AppropriationsEffImm} onChange={this._effectChanged} />
                </div>
                <div className={styles.column2}>
                    <ActionButton data-automation-id="removeFund"
                        iconProps={{ iconName: "Sub" }} onClick={this._remove}>Remove</ActionButton>
                </div>
            </div>
        );
    }

    @autobind
    private _fundSelected(option: IDropdownOption, index: number): void {
        const data: IAppropriationsAgenciesFund = clone(this.state.data);
        data.AppropriationsFund = option.key as string;
        this._setState(data);
    }

    @autobind
    private _amountChanged(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: IAppropriationsAgenciesFund = clone(this.state.data);
            data.AppropriationsAmount = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _effectChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
        const data: IAppropriationsAgenciesFund = clone(this.state.data);
        data.AppropriationsEffImm = checked;
        this._setState(data);
    }

    @autobind
    private _remove(): void {
        this.props.remove(this.props.index);
    }

    private _setState(data: IAppropriationsAgenciesFund): void {
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }
}