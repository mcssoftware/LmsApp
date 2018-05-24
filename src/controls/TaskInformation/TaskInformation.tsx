import * as React from "react";
import styles from "./TaskInformation.module.scss";
import { ITaskInformationProps } from "./ITaskInformationProps";
import { ITaskInformationState } from "./ITaskInformationState";
import {
    autobind,
    Label,
    Checkbox,
    TextField,
    PrimaryButton,
} from "office-ui-fabric-react";
import { ITasks, McsUtil } from "mcs-lms-core";
import { clone } from "@microsoft/sp-lodash-subset";

export default class TaskInformation extends React.Component<ITaskInformationProps, ITaskInformationState> {
    constructor(props: ITaskInformationProps, context?: any) {
        super(props, context);
        this.state = {
            comment: props.task.Comments || "",
            showCommentForm: false,
        };
    }

    public render(): React.ReactElement<ITaskInformationProps> {
        const { task } = this.props;
        return (
            <div className={styles.taskInformation}>
                <div className={styles.row}>
                    <div className={styles.column12}>
                        <Label className={styles.header}>Task:</Label> <Label>{task.Title}</Label>
                    </div>
                    <div className={styles.column12}>
                        <Label className={styles.header}>Assigned To:</Label>
                        <Label>{McsUtil.isDefined(task.AssignedTo) ? task.AssignedTo.Title : ""}</Label>
                    </div>
                    <div className={styles.column12}>
                        <Label className={styles.header}>Instructions:</Label>
                        <div>
                            <Label><text dangerouslySetInnerHTML={{ __html: task.Body }} /></Label>
                        </div>
                    </div>
                    {task.CommentsFromPreviousTask && (
                        <div className={styles.column12}>
                            <Label className={styles.header}>Previous Comments:</Label>
                            <Label>{task.CommentsFromPreviousTask}</Label>
                        </div>
                    )}
                    <div className={styles.column12}>
                        <Label className={styles.header}>Comments:</Label><Label>{task.Comments}</Label>
                    </div>
                    <div className={styles.column12}>
                        <Checkbox label="Add Comment" checked={this.state.showCommentForm} onChange={this._showCommentForm} />
                        {this.state.showCommentForm && (<div>
                            <Label className={styles.header}>Comments:</Label>
                            <TextField multiline rows={4} value={this.state.comment} onChanged={this._commentChanged} />
                            <PrimaryButton text="Save Comment"
                                onClick={this._saveComment}
                                // value={task.Comments}
                                className={styles.saveCommentsButton} />
                        </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    @autobind
    private _saveComment(): void {
        const comment: string = clone(this.state.comment);
        if (McsUtil.isFunction(this.props.onCommentAdded)) {
            this.props.onCommentAdded(comment);
        }
        this.setState({ ...this.state, showCommentForm: false });
        if (McsUtil.isFunction(this.props.onCommentEnabled)) {
            this.props.onCommentEnabled(false);
        }
    }

    @autobind
    private _commentChanged(value: string): void {
        this.setState({ ...this.state, comment: value });
    }

    @autobind
    private _showCommentForm(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
        if (McsUtil.isFunction(this.props.onCommentEnabled)) {
            this.props.onCommentEnabled(checked);
        }
        this.setState({ ...this.state, showCommentForm: checked });
    }
}