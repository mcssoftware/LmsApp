import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";
import { TextField, autobind } from "office-ui-fabric-react";
import { FormFieldStrings } from "./FormFieldStrings";
import { ControlMode } from "../ControlMode";

export interface IFileEditFieldState {
    fieldValue: string;
}

export default class FileEditField extends React.Component<ISPFormFieldProps, IFileEditFieldState> {
    private _fieldId: string;
    constructor(props: ISPFormFieldProps, context?: any) {
        super(props);
        this.state = {
            fieldValue: props.value ? props.value : "",
        };
        this._fieldId = "ard" + props.fieldSchema.InternalName + "txtField";
    }

    public render(): JSX.Element {
        return (
            <TextField
                className="ard-TextFormField"
                id={this._fieldId}
                name={this.props.fieldSchema.InternalName}
                type={this.props.controlMode === ControlMode.New ? "file" : "text"}
                value={this.state.fieldValue}
                onChanged={this._onValueChanged}
                placeholder={FormFieldStrings.TextFormFieldPlaceholder}
                underlined
                noValidate
            />
        );
    }

    @autobind
    private _onValueChanged(newValue: string): void {
        this.setState({ fieldValue: newValue });
        this.props.valueChanged(this._getUpdatedValue());
    }

    @autobind
    private _getUpdatedValue(): any {
        const fileList: FileList = (document.getElementById(this._fieldId) as HTMLInputElement).files;
        if (fileList !== null) {
            return fileList[0];
        }
        return null;
    }
}
