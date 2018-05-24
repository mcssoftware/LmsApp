import React = require("react");
import styles from "./FiscalNoteForm.module.scss";
import {
    autobind,
    Dropdown, IDropdownOption,
    ActionButton,
    TextField,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import { IFiscalNoteAgencyContact } from "./IFiscalNoteForm";
import { McsUtil } from "mcs-lms-core";

export interface IAgencyContactProps {
    AgencyContact: IFiscalNoteAgencyContact;
    agencyList: IDropdownOption[];
    remove?: (index: number) => void;
    index: number;
    onChanged: (value: IFiscalNoteAgencyContact, index: number) => void;
}

export interface IAgencyContactState {
    data: IFiscalNoteAgencyContact;
}

export class AgencyContactControl extends React.Component<IAgencyContactProps, IAgencyContactState> {
    constructor(props: IAgencyContactProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.AgencyContact),
        };
    }

    public render(): React.ReactElement<IAgencyContactProps> {
        const { data } = this.state;
        return (
            <div>
                <div className={styles.row}>
                    <div className={styles.column4}>
                        <Dropdown placeHolder="" selectedKey={data.Agency} required={true} options={this.props.agencyList} onChanged={this._agencySelected} />
                    </div>

                    <div className={styles.column3}>
                        <TextField value={data.ContactName} onChanged={this._contactNameChanged} />
                    </div>
                    <div className={styles.column3}>
                        <TextField value={data.ContactPhone} onChanged={this._contactPhoneChanged} />
                    </div>
                    <div className={styles.column2}>
                        <ActionButton iconProps={{ iconName: "Sub" }} onClick={this._remove}>Remove</ActionButton>
                    </div>
                </div>
            </div>
        );
    }

    @autobind
    private _agencySelected(option: IDropdownOption, index?: number): void {
        const data: IFiscalNoteAgencyContact = clone(this.state.data);
        if (index > 0 && McsUtil.isString(option.key)) {
            data.Agency = option.key as string;
            data.AgencyName = option.text;
        }
        this._setState(data);
    }

    @autobind
    private _contactNameChanged(value: string): void {
        const data: IFiscalNoteAgencyContact = clone(this.state.data);
        data.ContactName = value;
        this._setState(data);
    }

    @autobind
    private _contactPhoneChanged(value: string): void {
        const data: IFiscalNoteAgencyContact = clone(this.state.data);
        data.ContactPhone = value;
        this._setState(data);
    }

    @autobind
    private _remove(): void {
        this.props.remove(this.props.index);
    }

    private _setState(data: IFiscalNoteAgencyContact): void {
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }
}