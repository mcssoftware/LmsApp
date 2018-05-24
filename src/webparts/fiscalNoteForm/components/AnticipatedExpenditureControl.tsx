import React = require("react");
import styles from "./FiscalNoteForm.module.scss";
import {
    autobind,
    Dropdown, IDropdownOption,
    ActionButton,
    TextField,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import { INonAdminAnticipatedExpenditure } from "./IFiscalNoteForm";
import { McsUtil } from "mcs-lms-core";

export interface IAnticipatedExpenditureProps {
    anticipatedExpenditure: INonAdminAnticipatedExpenditure;
    index: number;
    fundList: IDropdownOption[];
    remove?: (index: number) => void;
    onChanged?: (data: INonAdminAnticipatedExpenditure, index: number) => void;
}

export interface IAnticipatedExpenditureState {
    data: INonAdminAnticipatedExpenditure;
}

export class AnticipatedExpenditureControl extends React.Component<IAnticipatedExpenditureProps, IAnticipatedExpenditureState> {
    constructor(props: IAnticipatedExpenditureProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.anticipatedExpenditure),
        };
    }

    public render(): React.ReactElement<IAnticipatedExpenditureProps> {
        const { data } = this.state;
        return (
            <div className={styles.row}>
                <div className={styles.column3}>
                    <Dropdown selectedKey={data.AnticipatedExpenditureFund}
                        required={true}
                        options={this.props.fundList}
                        onChanged={this._fundChanged} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AnticipatedExpenditureY1.toString()} onChanged={this._ExpenditureY1Changed} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AnticipatedExpenditureY2.toString()} onChanged={this._ExpenditureY2Changed} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AnticipatedExpenditureY3.toString()} onChanged={this._ExpenditureY3Changed} /></div>
                <div className={styles.column2}>
                    <Dropdown selectedKey={data.AnticipatedExpenditureType} required={true}
                        options={this._getAnticipatedExpenditureTypes()} onChanged={this._typeChanged} />
                </div>
                <div className={styles.column1}>
                    <ActionButton className={styles.removeButton} data-automation-id="removeExp"
                        iconProps={{ iconName: "Sub" }} onClick={this._removeExp}>Remove</ActionButton>
                </div>
            </div>
        );
    }

    private _getAnticipatedExpenditureTypes(): IDropdownOption[] {
        return [
            { key: "", text: "Select a type" },
            { key: "Increase", text: "Increase" },
            { key: "Decrease", text: "Decrease" },
        ];
    }

    @autobind
    private _ExpenditureY1Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: INonAdminAnticipatedExpenditure = clone(this.state.data);
            data.AnticipatedExpenditureY1 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _ExpenditureY2Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: INonAdminAnticipatedExpenditure = clone(this.state.data);
            data.AnticipatedExpenditureY2 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _ExpenditureY3Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: INonAdminAnticipatedExpenditure = clone(this.state.data);
            data.AnticipatedExpenditureY3 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _fundChanged(option: IDropdownOption, index?: number): void {
        const data: INonAdminAnticipatedExpenditure = clone(this.state.data);
        data.AnticipatedExpenditureFund = option.key.toString();
        this._setState(data);
    }

    @autobind
    private _typeChanged(option: IDropdownOption, index?: number): void {
        const data: INonAdminAnticipatedExpenditure = clone(this.state.data);
        data.AnticipatedExpenditureType = option.key.toString();
        this._setState(data);
    }

    @autobind
    private _removeExp(): void {
        this.props.remove(this.props.index);
    }

    private _setState(data: INonAdminAnticipatedExpenditure): void {
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }
}