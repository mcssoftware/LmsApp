import React = require("react");
import styles from "./FiscalNoteDirective.module.scss";
import {
    autobind,
    Dropdown, IDropdownOption,
    ActionButton,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import { IFiscalDirectiveAgency } from "./IFiscalDirectiveForm";
import { McsUtil } from "mcs-lms-core";

export interface IAgencyControlProps {
    agencyControl: IFiscalDirectiveAgency;
    index: number;
    onChanged?: (value: IFiscalDirectiveAgency, index: number) => void;
    disabled?: boolean;
    removeAgency?: (index: number) => void;
    options: IDropdownOption[];
}

export interface IAgencyControlState {
    data: IFiscalDirectiveAgency;
}

export class AgencyControl extends React.Component<IAgencyControlProps, IAgencyControlState> {
    constructor(props: IAgencyControlProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.agencyControl),
        };
    }

    public render(): React.ReactElement<IAgencyControlProps> {
        const { data } = this.state;
        const { disabled } = this.props;
        return (<div className={styles.row}>
            <div className={styles.column8}>
                <Dropdown disabled={!!disabled && true}
                    selectedKey={data.AgencyCode} required={true} onChanged={this._onAgencyCodeChange} options={this.props.options} />
            </div>
            <ActionButton disabled={!!disabled} iconProps={{ iconName: "Sub" }} onClick={this._removeAgency}>Remove</ActionButton>
        </div>
        );
    }

    @autobind
    private _onAgencyCodeChange(option: IDropdownOption, index?: number): void {
        const data: IFiscalDirectiveAgency = clone(this.state.data);
        data.AgencyCode = option.key as string;
        data.AgencyName = option.text;
        this.setState({
            ...this.state,
            data,
        });
        this.props.onChanged(data, this.props.index);
    }

    @autobind
    private _removeAgency(): void {
        this.props.removeAgency(this.props.index);
    }
}
