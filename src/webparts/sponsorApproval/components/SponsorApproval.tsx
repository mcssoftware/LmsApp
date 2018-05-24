import * as React from "react";
import styles from "./SponsorApproval.module.scss";
import { ISponsorApprovalProps } from "./ISponsorApprovalProps";
import { escape } from "@microsoft/sp-lodash-subset";
import { ISponsorApprovalState } from "./ISponsorApprovalState";
import LmsTask from "../../lmsTask/components/LmsTask";
import { IBills, ITasks } from "mcs-lms-core";
import {
  autobind,
  Label,
  Checkbox,
  PrimaryButton,
} from "office-ui-fabric-react";

export default class SponsorApproval extends React.Component<ISponsorApprovalProps, ISponsorApprovalState> {
  constructor(props: ISponsorApprovalProps, context: any) {
    super(props, context);
    this.state = {
      showSpinner: false,
    };
  }
  public render(): React.ReactElement<ISponsorApprovalProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        showTaskSpecificSection={true}
        showTaskAction={true}
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
      <div className={styles.sponsorApproval}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill:</Label>
          </div>
          <div className={styles.column12}>
            <PrimaryButton text="Create Extranet Task" onClick={this._createExtranetTask} />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _createExtranetTask(): void {
    this.setState({ ...this.state, showSpinner: true });
  }
}
