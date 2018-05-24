import * as React from "react";
import styles from "./CreateFormalDraft.module.scss";
import { ICreateFormalDraftProps } from "./ICreateFormalDraftProps";
import { clone } from "@microsoft/sp-lodash-subset";
import { ICreateFormalDraftState } from "./ICreateFormalDraftState";
import LmsTask from "../../lmsTask/components/LmsTask";
import {
  autobind,
  Label,
  IDropdownOption,
  PrimaryButton,
} from "office-ui-fabric-react";
import { ITasks, IBills } from "mcs-lms-core";
import { TasksServices } from "../../../services/TasksService";

export default class CreateFormalDraft extends React.Component<ICreateFormalDraftProps, ICreateFormalDraftState> {
  private _taskService: TasksServices;
  private readonly _options: IDropdownOption[] = [
    { key: "Attorney review, revision", text: "Attorney review, revision" },
    { key: "Director approval", text: "Director approval" },
    { key: "Cancel Draft, Folder to Bill Processing", text: "Cancel Draft, Folder to Bill Processing" },
  ];
  private _task: ITasks;
  private _bill: IBills;
  constructor(props: ICreateFormalDraftProps, context: any) {
    super(props, context);
    this._taskService = new TasksServices(props.isLocalEnvironment);
    this.state = {
      formalDraftCreated: false,
      showSpinner: false,
    };
  }

  public render(): React.ReactElement<ICreateFormalDraftProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        showTaskSpecificSection={!this.state.formalDraftCreated}
        showTaskAction={this.state.formalDraftCreated}
        postComponentMount={this._postComponentMount}
        showSpinner={this.state.showSpinner}
      />
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks): void {
    this._bill = bill;
    this._task = task;
    if (this._taskService.getTaskProperties(task).FormalCreated) {
      this.setState({ ...this.state, formalDraftCreated: true });
    }
  }

  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    const disableCreateFormal: boolean = !this._bill || !!this._bill.CheckoutUser;
    return (
      <div className={styles.createFormalDraft}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill: </Label>
          </div>
          <div className={styles.column12}>
            <PrimaryButton text="Create Formal Draft" onClick={this._createFormalDraft} disabled={disableCreateFormal} />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _createFormalDraft(): void {
    this.setState({ ...this.state, showSpinner: true });
    this._taskService.createFormalDraft(this._task, this._bill).then((result: ITasks) => {
      this._task = result;
      this.setState({ ...this.state, formalDraftCreated: true, showSpinner: false });
    });
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return new Promise((resolve, reject) => {
      resolve(this._task);
    });
  }
}
