import * as React from "react";
import styles from "./AssignEnrollNumber.module.scss";
import { IAssignEnrollNumberProps } from "./IAssignEnrollNumberProps";
import { escape, clone } from "@microsoft/sp-lodash-subset";
import { IAssignEnrollNumberState } from "./IAssignEnrollNumberState";
import {
  autobind,
  Label,
  DatePicker,
  Checkbox,
  PrimaryButton,
} from "office-ui-fabric-react";
import { ITasks, IBills, McsUtil } from "mcs-lms-core";
import LmsTask from "../../lmsTask/components/LmsTask";
import { TasksServices } from "../../../services/TasksService";

export default class AssignEnrollNumber extends React.Component<IAssignEnrollNumberProps, IAssignEnrollNumberState> {
  private _task: ITasks;
  private _getApiToken: () => Promise<string>;
  constructor(props: any, context: any) {
    super(props, context);
    this.state = {
      preTaskActionCompleted: false,
      billEffectiveDate: new Date(),
      isBillEngrossed: false,
      signedIn: false,
      error: "Error",
      showSpinner: false,
    };
  }

  public render(): React.ReactElement<IAssignEnrollNumberProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        preTaskCompletionAction={this._preTaskCompletionAction}
        showTaskSpecificSection={!this.state.preTaskActionCompleted}
        showTaskAction={this.state.preTaskActionCompleted}
        postComponentMount={this._postComponentMount}
        showSpinner={this.state.showSpinner}
      />
    );
  }

  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    return (
      <div className={styles.assignEnrollNumber}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill: </Label>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.column3}>
            <DatePicker
              label="Bill Effective date: "
              value={this.state.billEffectiveDate}
              isRequired={true}
              allowTextInput={false}
              isMonthPickerVisible={false}
              onSelectDate={this._onBillEffectiveDateSelected}
              formatDate={this._formatDate}
              placeholder="Select date..." />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Checkbox
              checked={this.state.isBillEngrossed}
              label="Is bill engrossed?"
              onChange={this._onCheckboxChange}
              ariaDescribedBy={"descriptionID"}
            />
          </div>
          <div className={styles.row}>
            <PrimaryButton text="Assign Enroll Number" onClick={this._assignEnrollNumber} />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks, getApiToken: () => Promise<string>): void {
    this._task = task;
    this._task.BillLookup = bill;
    this._getApiToken = getApiToken;
    if (/EnrollNumber/gi.test(this._task.TaskProperties)) {
      this.setState({ ...this.state, preTaskActionCompleted: true });
    }
  }

  @autobind
  private _formatDate(date: string | Date): string {
    if (McsUtil.isDefined(date)) {
      if (McsUtil.isString(date)) {
        return date.toString();
      }
      const dateValue: Date = date as Date;
      if (McsUtil.isFunction(dateValue.format)) {
        return dateValue.format("MM/dd/yyyy");
      } else {
        return dateValue.toLocaleDateString();
      }
    }
    return "";
  }

  @autobind
  private _onBillEffectiveDateSelected(date: Date | null | undefined): void {
    this.setState({
      ...this.state,
      billEffectiveDate: date,
    });
  }

  @autobind
  private _onCheckboxChange(ev: React.FormEvent<HTMLElement>, isChecked: boolean): void {
    this.setState({
      ...this.state,
      isBillEngrossed: isChecked,
    });
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return null; // currently null for error reduction only
  }

  @autobind
  private _assignEnrollNumber(): void {
    this.setState({ ...this.state, showSpinner: true });
    const taskService: TasksServices = new TasksServices(this.props.isLocalEnvironment);
    this._getApiToken().then((token) => {
      taskService.assignEnrollNumber(this.props.httpClient, token, this._task, this.state.billEffectiveDate).then(() => {
        this.setState({ ...this.state, preTaskActionCompleted: true, showSpinner: false });
      }, (err) => {
        this.setState({ ...this.state, error: err });
      });
    }, (err) => {
      this.setState({ ...this.state, error: err });
    });
  }
}