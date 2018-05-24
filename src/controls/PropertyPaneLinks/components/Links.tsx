import React = require("react");
import { ILinksProps } from "./ILinksProps";
import { ILinksState } from "./ILinksState";
import {
    autobind,
    Label,
    List,
    Link,
    TextField,
    PrimaryButton,
    DefaultButton,
    IconButton,
    Dialog,
    DialogType,
    DialogFooter,
    FocusZone,
    FocusZoneDirection,
} from "office-ui-fabric-react";
import styles from "./List.module.scss";
import { clone } from "@microsoft/sp-lodash-subset";
import ILinks from "../ILinks";
import { McsUtil } from "mcs-lms-core";

export default class Links extends React.Component<ILinksProps, ILinksState> {
    constructor(props: ILinksProps, state: ILinksState) {
        super(props);
        this.state = {
            Items: McsUtil.isArray(props.Items) ? props.Items : [],
            newItem: { text: "", url: "" },
            editIndex: -1,
            showDialog: false,
        };
    }

    public render(): JSX.Element {
        return (
            <div>
                <Label>{this.props.label}</Label>
                <FocusZone direction={FocusZoneDirection.vertical}>
                    <div className={styles.container} data-is-scrollable={true}>
                        <List items={this.state.Items} onRenderCell={this._onRenderCell} />
                    </div>
                </FocusZone>
                <DefaultButton
                    description="Opens the new link modal"
                    onClick={this._showDialog}
                    text="Add"
                />
                <Dialog hidden={!this.state.showDialog}
                    onDismiss={this._closeDialog}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: "New link",
                        subText: "",
                    }}
                    modalProps={{
                        isBlocking: false,
                        containerClassName: "ms-dialogMainOverride",
                    }}>
                    <TextField label="Text" value={this.state.newItem.text} onChanged={this._onTextChanged} />
                    <TextField label="Url" value={this.state.newItem.url} onChanged={this._onUrlChanged} />
                    <DialogFooter>
                        <PrimaryButton disabled={this.state.newItem.text.length < 1 || this.state.newItem.url.length < 1} onClick={this._addNewLink} text="Save" />
                        <DefaultButton onClick={this._closeDialog} text="Cancel" />
                    </DialogFooter>
                </Dialog>
            </div>
        );
    }

    @autobind
    private _onTextChanged(newValue: string): void {
        this.setState({ ...this.state, newItem: { text: newValue, url: this.state.newItem.url } });
    }

    @autobind
    private _onUrlChanged(newValue: string): void {
        this.setState({ ...this.state, newItem: { text: this.state.newItem.text, url: newValue } });
    }

    @autobind
    private _onRenderCell(item: any, index: number): JSX.Element {
        return (
            <div className={styles.itemCell} data-is-focusable={true}>
                <div className={styles.itemContent}>
                    <Link className={styles.itemLink} href={item.url}>{item.text}</Link>
                    <IconButton className={styles.itemButton} iconProps={{ iconName: "Edit" }} title="Edit" ariaLabel="Edit" onClick={() => { this._editItem(index); }} />
                    <IconButton className={styles.itemButton} iconProps={{ iconName: "delete" }} title="delete" ariaLabel="delete" onClick={() => { this._removeItem(index); }} />
                </div>
            </div>
        );
    }

    @autobind
    private _showDialog(): void {
        this.setState({ showDialog: true });
    }

    @autobind
    private _closeDialog(): void {
        this.setState({ ...this.state, newItem: { text: "", url: "" }, editIndex: -1, showDialog: false });
    }

    @autobind
    private _addNewLink(): void {
        const { newItem, editIndex } = this.state;
        const allItems: ILinks[] = clone(this.state.Items);
        if (editIndex !== -1) {
            allItems[editIndex].text = newItem.text;
            allItems[editIndex].text = newItem.text;
        }
        else {
            allItems.push({ text: newItem.text, url: newItem.url });
        }
        this.setState({ ...this.state, Items: allItems, newItem: { text: "", url: "" }, editIndex: -1, showDialog: false });
        this.props.onChanged(allItems);
    }

    private _removeItem(index: number): void {
        const allItems: ILinks[] = clone(this.state.Items);
        allItems.splice(index, 1);
        this.setState({ ...this.state, Items: allItems });
        this.props.onChanged(allItems);
    }

    private _editItem(index: number): void {
        const allItems: ILinks[] = clone(this.state.Items);
        const newItem: ILinks = allItems[index];
        this.setState({ ...this.state, Items: allItems, newItem: { text: newItem.text, url: newItem.url }, editIndex: index, showDialog: true });
        this.props.onChanged(allItems);
    }
}