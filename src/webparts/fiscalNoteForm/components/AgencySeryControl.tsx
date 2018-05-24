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
import { INonAdminAnticipatedExpenditure, IAppropriationsAgenciesSery } from "./IFiscalNoteForm";
import { McsUtil } from "mcs-lms-core";

export interface IAgencySeryProps {
    agencySeries: IAppropriationsAgenciesSery;
    index: number;
    seriesList: IDropdownOption[];
    onChanged?: (value: IAppropriationsAgenciesSery, index: number) => void;
    remove: (index: number) => void;
}

export interface IAgencySeryState {
    data: IAppropriationsAgenciesSery;
}

export class AgencySeryControl extends React.Component<IAgencySeryProps, IAgencySeryState> {
    constructor(props: IAgencySeryProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.agencySeries),
        };
    }

    public render(): React.ReactElement<IAgencySeryProps> {
        const { data } = this.state;
        return (
            <div className={styles.row}>
                <div className={styles.column4}>
                    <Dropdown
                        selectedKey={data.AppropriationSeries}
                        required={true}
                        options={this.props.seriesList}
                        onChanged={this._seryChanged} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AppropriationSeriesY1.toString()} onChanged={this._seryY1Changed} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AppropriationSeriesY2.toString()} onChanged={this._seryY2Changed} />
                </div>
                <div className={styles.column2}>
                    <TextField value={data.AppropriationSeriesY3.toString()} onChanged={this._seryY3Changed} />
                </div>
                <div className={styles.column2}>
                    <ActionButton data-automation-id="removeSery"
                        iconProps={{ iconName: "Sub" }} onClick={this._remove}>Remove</ActionButton>
                </div>
            </div>
        );
    }

    @autobind
    private _seryY1Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: IAppropriationsAgenciesSery = clone(this.state.data);
            data.AppropriationSeriesY1 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _seryY2Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: IAppropriationsAgenciesSery = clone(this.state.data);
            data.AppropriationSeriesY2 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _seryY3Changed(value: string): void {
        if (McsUtil.isNumberString(value)) {
            const data: IAppropriationsAgenciesSery = clone(this.state.data);
            data.AppropriationSeriesY3 = parseInt(value, 10);
            this._setState(data);
        }
    }

    @autobind
    private _seryChanged(option: IDropdownOption, index?: number): void {
        const data: IAppropriationsAgenciesSery = clone(this.state.data);
        data.AppropriationSeries = option.key.toString();
        this._setState(data);
    }

    @autobind
    private _remove(): void {
        this.props.remove(this.props.index);
    }

    private _setState(data: IAppropriationsAgenciesSery): void {
        this.props.onChanged(data, this.props.index);
        this.setState({ ...this.state, data });
    }
}