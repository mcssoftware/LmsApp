import * as React from "react";
import styles from "./FiscalNoteForm.module.scss";
import {
    autobind,
    Dropdown, IDropdownOption,
    ActionButton,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import { IFiscalNoteAgencyContact, IAdminImpactAgency } from "./IFiscalNoteForm";
import { McsUtil } from "mcs-lms-core";

export interface IAdminImpactAgencyProp {
    Agency: IAdminImpactAgency;
    agencyList: IDropdownOption[];
    remove?: (index: number) => void;
    index: number;
    onChanged: (value: IAdminImpactAgency, index: number) => void;
}

export interface IAdminImpactAgencyState {
    data: IAdminImpactAgency;
}

export class AdminImpactAgencyControl extends React.Component<IAdminImpactAgencyProp, IAdminImpactAgencyState> {
    constructor(props: IAdminImpactAgencyProp, context?: any) {
        super(props);
        this.state = {
            data: clone(props.Agency),
        };
    }

    public render(): React.ReactElement<IAdminImpactAgencyProp> {
        const { data } = this.state;
        return (
            <div className={styles.row}>
                <div className={styles.column10}>
                    <Dropdown placeHolder=""
                        selectedKey={data.AgencyName}
                        required={true}
                        options={this.props.agencyList}
                        onChanged={this._agencySelected} />
                </div>
                <div className={styles.column2}>
                    <ActionButton iconProps={{ iconName: "Sub" }} onClick={this._remove}>Remove</ActionButton>
                </div>
            </div>
        );
    }

    @autobind
    private _agencySelected(option: IDropdownOption, index?: number): void {
        const data: IAdminImpactAgency = clone(this.state.data);
        if (index > 0 && McsUtil.isString(option.key)) {
            data.AgencyName = option.key as string;
        }
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }

    @autobind
    private _remove(): void {
        this.props.remove(this.props.index);
    }
}