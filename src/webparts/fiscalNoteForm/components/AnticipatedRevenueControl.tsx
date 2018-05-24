import React = require("react");
import styles from "./FiscalNoteForm.module.scss";
import {
    Dropdown, IDropdownOption,
    ActionButton,
    TextField,
    Checkbox,
    autobind,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import { INonAdminAnticipatedExpenditure, INonAdminAnticipatedRevenue } from "./IFiscalNoteForm";
import { McsUtil } from "mcs-lms-core";

export interface IAnticipatedRevenueProps {
    anticipatedRevenue: INonAdminAnticipatedRevenue;
    index: number;
    fundList: IDropdownOption[];
    remove?: (index: number) => void;
    onChanged?: (value: INonAdminAnticipatedRevenue, index: number) => void;
}

export interface IAnticipatedRevenueState {
    data: INonAdminAnticipatedRevenue;
}

export class AnticipatedRevenueControl extends React.Component<IAnticipatedRevenueProps, IAnticipatedRevenueState> {
    constructor(props: IAnticipatedRevenueProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.anticipatedRevenue),
        };
    }

    public render(): React.ReactElement<IAnticipatedRevenueProps> {
        const { data } = this.state;
        return (
            <div className={styles.row}>
                <div className={styles.column3}>
                    <Dropdown
                        selectedKey={data.AnticipatedRevenueFund}
                        required={true}
                        options={this.props.fundList}
                        onChanged={this._fundChanged} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AnticipatedRevenueY1.toString()} onChanged={this._revenueY1Changed} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AnticipatedRevenueY2.toString()} onChanged={this._revenueY2Changed} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AnticipatedRevenueY3.toString()} onChanged={this._revenueY3Changed} /></div>
                <div className={styles.column2}>
                    <Dropdown selectedKey={data.AnticipatedRevenueType} required={true}
                        options={this._getAnticipatedRevenueTypes()} onChanged={this._typeChanged} />
                </div>
                <div className={styles.column1}>
                    <ActionButton className={styles.removeButton} data-automation-id="removeRevenue"
                        iconProps={{ iconName: "Sub" }} onClick={this._removeRevenue}>Remove</ActionButton>
                </div>
            </div>
        );
    }

    private _getAnticipatedRevenueTypes(): IDropdownOption[] {
        return [
            { key: "", text: "Select a type" },
            { key: "Increase", text: "Increase" },
            { key: "Decrease", text: "Decrease" },
        ];
    }

    @autobind
    private _revenueY1Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: INonAdminAnticipatedRevenue = clone(this.state.data);
            data.AnticipatedRevenueY1 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _revenueY2Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: INonAdminAnticipatedRevenue = clone(this.state.data);
            data.AnticipatedRevenueY2 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _revenueY3Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: INonAdminAnticipatedRevenue = clone(this.state.data);
            data.AnticipatedRevenueY3 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _fundChanged(option: IDropdownOption, index?: number): void {
        const data: INonAdminAnticipatedRevenue = clone(this.state.data);
        data.AnticipatedRevenueFund = option.key.toString();
        this._setState(data);
    }

    @autobind
    private _typeChanged(option: IDropdownOption, index?: number): void {
        const data: INonAdminAnticipatedRevenue = clone(this.state.data);
        data.AnticipatedRevenueType = option.key.toString();
        this._setState(data);
    }

    @autobind
    private _removeRevenue(): void {
        this.props.remove(this.props.index);
    }

    private _setState(data: INonAdminAnticipatedRevenue): void {
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }
}