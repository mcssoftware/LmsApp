import * as React from "react";
import { Logger, FunctionListener, LogEntry, LogListener, LogLevel } from "sp-pnp-js";
import {
    autobind,
    Dialog, DialogType, DialogFooter,
    PrimaryButton, DefaultButton,
} from "office-ui-fabric-react";
import styles from "./Dialog.module.scss";

import { IDialogProps } from "./IDialogProps";
import { IDialogState } from "./IDialogState";

export class DialogControl extends React.Component<IDialogProps, IDialogState> {

    constructor(props: any) {
        super(props);
        this.state = {
            ...this.state,
            hideDialog: !this.props.isHidden,
        };
    }

    // public getDerivedStateFromProps(nextProps: IDialogProps, prevState: IDialogState): IDialogState {
    //     return {
    //         hideDialog: !nextProps.isHidden,
    //     } as IDialogState;
    // }

    public componentWillReceiveProps(isHidden: any): void {
        this.setState({
            ...this.state,
            hideDialog: !isHidden,
        });
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <Dialog
                    hidden={this.state.hideDialog}
                    onDismiss={this._closeDialog}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: "Alert",
                        subText: "Do you want to proceed?",
                    }}
                    modalProps={{
                        titleAriaId: "myLabelId",
                        subtitleAriaId: "mySubTextId",
                        isBlocking: false,
                        containerClassName: "ms-dialogMainOverride",
                    }}
                >
                    {null /** You can also include null values as the result of conditionals */}
                    <DialogFooter>
                        <PrimaryButton onClick={this._closeDialog} text="Yes" />
                        <DefaultButton onClick={this._closeDialog} text="No" />
                    </DialogFooter>
                </Dialog>
            </div>
        );
    }

    @autobind
    private _showDialog(): void {
        this.setState({ ...this.state, hideDialog: false });
    }

    @autobind
    private _closeDialog(): void {
        this.setState({ ...this.state, hideDialog: true });
    }
}