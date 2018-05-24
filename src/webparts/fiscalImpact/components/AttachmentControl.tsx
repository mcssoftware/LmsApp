import * as React from "react";
import styles from "./FiscalImpact.module.scss";
import {
    autobind,
    ActionButton,
} from "office-ui-fabric-react";
import { IFiscalImpactAttachment } from "./IFiscalImpactForm";
import { clone } from "@microsoft/sp-lodash-subset";
import { McsUtil } from "mcs-lms-core";

export interface IAttachmentControlProps {
    attachment: IFiscalImpactAttachment;
    index: number;
    onChanged?: (data: IFiscalImpactAttachment, index: number) => void;
    removeAttachment?: (index: number) => void;
}

export interface IAttachmentControlState {
    data: IFiscalImpactAttachment;
}

export class AttachmentControl extends React.Component<IAttachmentControlProps, IAttachmentControlState> {
    constructor(props: IAttachmentControlProps, context?: any) {
        super(props);
        this.state = {
            data: clone(props.attachment),
        };
    }

    public render(): React.ReactElement<IAttachmentControlProps> {
        const { data } = this.state;
        return (
            <div className={styles.row}>
                <div className={styles.column12}>
                    <div className={styles.column4}>
                        <input type="file" onChange={this._fileChanged} />
                    </div>
                    <div className={styles.column2}>
                        <ActionButton iconProps={{ iconName: "Sub" }} onClick={this._removeAttachment}>Remove</ActionButton>
                    </div>
                </div>
            </div>
        );
    }

    @autobind
    private _fileChanged(e: any): void {
        const data: IFiscalImpactAttachment = clone(this.state.data);
        // tslint:disable-next-line:no-console
        console.log(e);
        // data.FileName = e.target.files[0];
        this.setState({ ...this.state, data });
    }

    @autobind
    private _removeAttachment(): void {
        this.props.removeAttachment(this.props.index);
    }
}