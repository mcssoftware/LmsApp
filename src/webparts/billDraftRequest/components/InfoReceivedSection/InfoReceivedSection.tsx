import * as React from "react";
import styles from "./InfoReceivedSection.module.scss";
import { IInfoReceivedSectionProps } from "./IInfoReceivedSectionProps";
import {
    autobind,
    ChoiceGroup,
    IChoiceGroupOption,
    TextField,
} from "office-ui-fabric-react";
import { IInfoReceivedSectionState } from "./IInfoReceivedSectionState";
import { McsUtil } from "mcs-lms-core";
import { clone } from "@microsoft/sp-lodash-subset";

export default class InfoReceivedSection extends React.Component<IInfoReceivedSectionProps, IInfoReceivedSectionState> {
    private readonly _other: string = "Other";
    constructor(props: IInfoReceivedSectionProps, context?: any) {
        super(props, context);
        this.state = {
            selectedRadioValue: null,
            textFieldValue: null,
            validation: {
                hasError: false,
                errorMessage: "",
            },
        };
    }

    public componentDidMount(): void {
        let initialTextFieldValue: string = "";
        let initialRadioValue: string = "";
        if (McsUtil.isDefined(this.props) && McsUtil.isArray(this.props.options)) {
            if (McsUtil.isString(this.props.selectedValue)) {
                if (this.props.options.filter((x) => x.key === this.props.selectedValue)) {
                    initialRadioValue = this.props.selectedValue;
                } else {
                    initialRadioValue = this._other;
                    initialTextFieldValue = this.props.selectedValue;
                }
            } else {
                initialRadioValue = this.props.options[0].key;
            }
        }
        this.setState({
            ...this.state,
            selectedRadioValue: initialRadioValue,
            textFieldValue: initialTextFieldValue,
        });
    }

    public render(): React.ReactElement<IInfoReceivedSectionProps> {
        return (
            <div className={styles.inforeceivedmethod} >
                <div className={styles.container}>
                    <ChoiceGroup label={this.props.label}
                        selectedKey={this.state.selectedRadioValue}
                        className={styles.inlineflex}
                        options={this.props.options}
                        onChange={this._onRadioChange}
                    />
                    <TextField
                        className={styles.inlineflex}
                        disabled={this.state.selectedRadioValue !== this._other}
                        value={this.state.textFieldValue}
                        required={this.props.isrequired}
                        onChanged={this._onTextChanged}
                    />
                </div>
            </div>
        );
    }

    public componentDidUpdate(props: IInfoReceivedSectionProps): void {
        if (McsUtil.isDefined(this.props) && McsUtil.isString(this.props.selectedValue)) {
            if (this.props.selectedValue !== this.state.selectedRadioValue && this.props.selectedValue !== this.state.textFieldValue) {
                if (this.props.options.filter((x) => x.key === this.props.selectedValue).length > 0) {
                    this.setState({ ...this.state, selectedRadioValue: this.props.selectedValue, textFieldValue: "", validation: this._getValidation() });
                } else {
                    this.setState({ ...this.state, selectedRadioValue: this._other, textFieldValue: this.props.selectedValue, validation: this._getValidation() });
                }
            }
        }
    }

    @autobind
    private _onRadioChange(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
        if (McsUtil.isFunction(this.props.onChanged)) {
            if (option.key !== this._other) {
                this.props.onChanged(option.key);
            } else {
                this.props.onChanged("");
            }
        }
        this.setState({
            ...this.state,
            selectedRadioValue: option.key,
            textFieldValue: "",
            validation: this._getValidation((option.key === this._other) ? "" : option.key),
        });
    }

    @autobind
    private _onTextChanged(newvalue: string): void {
        if (McsUtil.isFunction(this.props.onChanged)) {
            this.props.onChanged(newvalue);
        }
        this.setState({
            ...this.state,
            textFieldValue: newvalue,
            validation: this._getValidation(newvalue),
        });
    }

    private _getValidation(text?: string): any {
        const validation: any = {
            hasError: false,
            errorMessage: "",
        };
        if (text === "") {
            validation.hasError = true;
            validation.errorMessage = this.props.errorMessage;
        }
        return validation;
    }
}
