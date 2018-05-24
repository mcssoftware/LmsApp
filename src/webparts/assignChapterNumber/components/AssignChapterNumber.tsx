import * as React from "react";
import styles from "./AssignChapterNumber.module.scss";
import { IAssignChapterNumberProps } from "./IAssignChapterNumberProps";
import { clone } from "@microsoft/sp-lodash-subset";
import { IAssignChapterNumberState } from "./IAssignChapterNumberState";
import LmsTask from "../../lmsTask/components/LmsTask";
import {
  autobind,
  Label,
  TextField,
  PrimaryButton,
  DatePicker,
} from "office-ui-fabric-react";
import { McsUtil, ITasks, IBills } from "mcs-lms-core";
import { TasksServices } from "../../../services/TasksService";

export default class AssignChapterNumber extends React.Component<IAssignChapterNumberProps, IAssignChapterNumberState> {
  private _task: ITasks;
  constructor(props: any, context: any) {
    super(props, context);
    this.state = {
      createdDate: new Date(),
      billEffectiveDate: new Date(),
      chapterNumber: "",
      chapterNumberAssigned: false,
      showSpinner: false,
    };
  }

  public render(): React.ReactElement<IAssignChapterNumberProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        preTaskCompletionAction={this._preTaskCompletionAction}
        showTaskSpecificSection={!this.state.chapterNumberAssigned}
        showTaskAction={this.state.chapterNumberAssigned}
        postComponentMount={this._postComponentMount}
        showSpinner={this.state.showSpinner}
      />
    );
  }

  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    return (
      <div className={styles.assignChapterNumber}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill: </Label>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.column3}>
            <DatePicker
              label="Chapter Created Date:"
              value={this.state.createdDate}
              isRequired={true}
              allowTextInput={false}
              isMonthPickerVisible={false}
              onSelectDate={this._onCreatedDateSelected}
              placeholder="Select date..." />
          </div>
          <div className={styles.column3}>
            <DatePicker
              label="Bill Effective Date:"
              value={this.state.billEffectiveDate}
              isRequired={true}
              allowTextInput={false}
              isMonthPickerVisible={false}
              onSelectDate={this._onBillEffectiveDateSelected}
              placeholder="Select date..." />
          </div>
          <div className={styles.column3}>
            <TextField
              value={this.state.chapterNumber}
              label="Assign Chapter Number:" onChanged={this._chapterNumberAssigned} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.column12}>
            <PrimaryButton text="Assign Chapter Number" onClick={this._assignChapterNumber} />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks): void {
    this._task = task;
    this._task.BillLookup = bill;
    if (/ChapterSignedDate/gi.test(task.TaskProperties)) {
      this.setState({ ...this.state, chapterNumberAssigned: true });
    }
  }

  @autobind
  private _getModifiedProperty(): ITasks {
    return this._task;
  }

  @autobind
  private _chapterNumberAssigned(value: string): void {
    if (McsUtil.isString(value)) {
      value = value.length > 3 ? value.substring(0, 3) : value;
    }
    this._task.BillLookup.ChapterNumber = value;
    this.setState({
      ...this.state,
      chapterNumber: value,
    });
  }

  @autobind
  private _onBillEffectiveDateSelected(date: Date | null | undefined): void {
    this._task.BillLookup.BillEffectiveDate = date.toString();
    this.setState({
      ...this.state,
      billEffectiveDate: date,
    });
  }

  @autobind
  private _onCreatedDateSelected(date: Date | null | undefined): void {
    this._task.BillLookup.ChapterSignedOn = date.toString();
    this.setState({
      ...this.state,
      createdDate: date,
    });
  }

  @autobind
  private _assignChapterNumber(): void {
    this.setState({ ...this.state, showSpinner: true });
    const taskService: TasksServices = new TasksServices(this.props.isLocalEnvironment);
    const chapterNumber: number = parseInt(clone(this.state.chapterNumber), 10);
    taskService.assignChapterNumberToBill(this._task.BillLookup,
      this._task,
      chapterNumber,
      this.state.createdDate,
      this.state.billEffectiveDate,
    ).then(() => {
      this.setState({ ...this.state, chapterNumberAssigned: true, showSpinner: false });
    });
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return null;
  }
}