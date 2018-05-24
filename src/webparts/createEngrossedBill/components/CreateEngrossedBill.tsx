import * as React from "react";
import { escape } from "@microsoft/sp-lodash-subset";
import styles from "./CreateEngrossedBill.module.scss";
import { ICreateEngrossedBillProps } from "./ICreateEngrossedBillProps";
import { ICreateEngrossedBillState } from "./ICreateEngrossedBillState";
import {
  autobind,
  Label,
  PrimaryButton, DefaultButton,
} from "office-ui-fabric-react";

import { ITasks, IBills } from "mcs-lms-core";

import LmsTask from "../../lmsTask/components/LmsTask";
import { TasksServices } from "../../../services/TasksService";

export default class CreateEngrossedBill extends React.Component<ICreateEngrossedBillProps, ICreateEngrossedBillState> {

  private _defaultButtonDivClassArray: any;
  private _defaultButtonDivClasses: any;

  private _task: ITasks;
  private _bill: IBills;
  private _getApiToken: () => Promise<string>;
  constructor(props: any, context: any) {
    super(props, context);
    this.state = {
      engrossedBillCreated: false,
      showSpinner: false,
      defaultButtonDivClasses: "",
    };
  }

  public componentDidMount(): void {
    this._defaultButtonDivClassArray = [];
    this._defaultButtonDivClasses = this._defaultButtonDivClassArray.join(" ");
    this.setState({
      ...this.state,
      defaultButtonDivClasses: this._defaultButtonDivClasses,
    });
  }

  public render(): React.ReactElement<ICreateEngrossedBillProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        preTaskCompletionAction={this._preTaskCompletionAction}
        showTaskSpecificSection={!this.state.engrossedBillCreated}
        showTaskAction={this.state.engrossedBillCreated}
        postComponentMount={this._postComponentMount}
        showSpinner={this.state.showSpinner}
      />
    );
  }

  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    return (
      <div className={styles.createEngrossedBill}>
        <div className={styles.row}>
          <div className={this.state.defaultButtonDivClasses}>
            <div className={styles.column12}>
              <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill: </Label>
            </div>
            <div className={styles.column12}>
              <PrimaryButton className={styles.button} text="Create Engrossed Bill" onClick={this._createEngrossedBill} />
              <PrimaryButton className={styles.button} text="Send to opposite Chamber without Engrossing" onClick={this._sendToOpposite} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  private _hideButtonDiv(): void {
    this._defaultButtonDivClassArray = [styles.hideDefaultButtonDiv];
    this._defaultButtonDivClasses = this._defaultButtonDivClassArray.join(" ");
    this.setState({
      ...this.state,
      defaultButtonDivClasses: this._defaultButtonDivClasses,
    });
  }

  @autobind
  private _createEngrossedBill(): void {
    this.setState({ ...this.state, showSpinner: true });
    const taskService: TasksServices = new TasksServices(this.props.isLocalEnvironment);
    this._getApiToken().then((token: string) => {
      taskService.createEngrossedBill(this.props.httpClient, token, this._bill, this._task).then(() => {
        this.setState({ ...this.state, showSpinner: false });
        this._hideButtonDiv();
      });
    });
  }

  @autobind
  private _sendToOpposite(): void {
    this._hideButtonDiv();
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return null; // currently null for error reduction only
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks, getApiToken: () => Promise<string>): void {
    this._bill = bill;
    this._task = task;
    this._getApiToken = getApiToken;
    this.setState({
      ...this.state,
      engrossedBillCreated: false,
    });
  }
}
