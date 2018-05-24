import * as React from "react";
import { IList } from "mcs-lms-core";
import { DefaultButton, Dialog, DialogFooter, PrimaryButton, autobind } from "office-ui-fabric-react";
import { CustomListForm } from "../CustomListForm/CustomListForm";
import { ISpFormDialogProps } from "./ISpFormDialogProps";
import { ISpFormDialogState } from "./ISpFormDialogState";

export class SpFormDialog extends React.Component<ISpFormDialogProps, ISpFormDialogState> {
    constructor(props: ISpFormDialogProps, context?: any) {
        super(props, context);
        this.state = {
            hideDialog: true,
        };
    }

    public render(): React.ReactElement<ISpFormDialogProps> {
        return (
            <div>
                <DefaultButton
                    onClick={this._showDialog}
                    text="Add item"
                />
                <Dialog
                    hidden={this.state.hideDialog}
                    onDismiss={this._closeDialog}
                    modalProps={{
                        isBlocking: true,
                        containerClassName: "ms-dialogMainOverride",
                    }}
                >
                    {!this.state.hideDialog && <CustomListForm
                        webUrl={this.props.webUrl}
                        listId={this.props.listId}
                        formTitle={this.props.formTitle}
                        formType={this.props.formType}
                        itemId={this.props.itemId}
                        showUnsupportedFields={false}
                        onSubmitSucceeded={this._itemAdded}
                        onCancel={this._closeDialog}
                        defaultValues={this.props.defaultValues || {}}
                    />}
                </Dialog>
            </div>
        );
    }

    @autobind
    private _showDialog(): void {
        this.setState({ hideDialog: false });
    }

    @autobind
    private _closeDialog(): void {
        this.setState({ hideDialog: true });
    }

    @autobind
    private _itemAdded(): void {
        window.location.reload();
        // this.setState({ hideDialog: true });
    }
}