import * as React from "react";
import styles from "./CreateBillSummary.module.scss";
import { ICreateBillSummaryProps } from "./ICreateBillSummaryProps";
import { escape } from "@microsoft/sp-lodash-subset";
import LmsTask from "../../lmsTask/components/LmsTask";
import { ICreateBillSummaryState } from "./ICreateBillSummaryState";
import {
  autobind,
  Label,
  PrimaryButton,
} from "office-ui-fabric-react";
import { IBills, ITasks } from "mcs-lms-core";

export default class CreateBillSummary extends React.Component<ICreateBillSummaryProps, ICreateBillSummaryState> {
  private _selectedUserId: number;
  constructor(props: ICreateBillSummaryProps, context: any) {
    super(props, context);
    this.state = {
      billSummaryCreated: false,
      showSpinner: false,
    };
  }
  public render(): React.ReactElement<ICreateBillSummaryProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        showTaskSpecificSection={!this.state.billSummaryCreated}
        showTaskAction={this.state.billSummaryCreated}
        postComponentMount={this._postComponentMount}
        showSpinner={this.state.showSpinner} />
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks): void {
    //
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return null;
  }
  // checkboxChecked
  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    return (
      <div className={styles.createBillSummary}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill:</Label>
          </div>
          <div className={styles.column12}>
            <PrimaryButton text="Create Bill Summary" onClick={this._createBillSummary} />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _createBillSummary(): void {
    this.setState({ ...this.state, billSummaryCreated: true, showSpinner: true });
  }
}
