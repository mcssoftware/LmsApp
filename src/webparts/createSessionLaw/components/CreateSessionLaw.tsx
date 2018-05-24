import * as React from "react";
import styles from "./CreateSessionLaw.module.scss";
import { ICreateSessionLawProps } from "./ICreateSessionLawProps";
import { ICreateSessionLawState } from "./ICreateSessionLawState";
import {
  autobind,
  PrimaryButton,
  Label,
  ChoiceGroup, IChoiceGroupOption,
  DatePicker,
} from "office-ui-fabric-react";

import LmsTask from "../../lmsTask/components/LmsTask";
import { ITasks, IBills, McsUtil } from "mcs-lms-core";
import { TasksServices } from "../../../services/TasksService";

export default class CreateSessionLaw extends React.Component<ICreateSessionLawProps, ICreateSessionLawState> {
  private readonly _options: IChoiceGroupOption[] = [
    {
      key: "Approved",
      text: "Approved",
    } as IChoiceGroupOption,
    {
      key: "Became law without signature",
      text: "Became law without signature",
    },
  ];
  private _task: ITasks;
  private _bill: IBills;
  private _getApiToken: () => Promise<string>;
  constructor(props: any, context: any) {
    super(props, context);
    this.state = ({
      ...this.state,
      sessionLawCreated: false,
      hasChapterNumber: false,
      selectedOption: "Approved",
      date: null,
      showSpinner: false,
    });
  }

  public render(): React.ReactElement<ICreateSessionLawProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        preTaskCompletionAction={this._preTaskCompletionAction}
        showTaskSpecificSection={!this.state.sessionLawCreated}
        showTaskAction={this.state.sessionLawCreated}
        postComponentMount={this._postComponentMount}
        showSpinner={this.state.showSpinner}
      />
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks, getApiToken: () => Promise<string>): void {
    this._bill = bill;
    this._task = task;
    this._getApiToken = getApiToken;
    this.setState({ ...this.state, hasChapterNumber: McsUtil.isNumberString(bill.ChapterNumber), sessionLawCreated: /SessionLawCreated/gi.test(task.TaskProperties) });
  }

  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    return (
      <div className={styles.createSessionLaw}>
        <div className={styles.row}>
          {!this.state.hasChapterNumber && <div className={styles.column12}>
            <Label>The task needs to be assigned chapter number. </Label>
          </div>}
          {this.state.hasChapterNumber && <div>
            <div className={styles.column12}>
              <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill: </Label>
            </div>
            <div className={styles.column3}>
              <DatePicker
                label="Date: "
                isRequired={true}
                allowTextInput={false}
                isMonthPickerVisible={false}
                onSelectDate={this._onDateSelected}
                value={this.state.date}
                formatDate={this._formatDate}
                placeholder="Select date..." />
            </div>
            <div className={styles.column12}>
              <ChoiceGroup
                selectedKey={this.state.selectedOption}
                options={this._options}
                onChange={this._onRadioChanged}
              />
            </div>
            <div className={styles.column12}>
              <PrimaryButton text="Create Session Law" onClick={this._createSessionLaw} />
            </div>
          </div>}
        </div>
      </div>
    );
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
  private _onDateSelected(date: Date | null | undefined): void {
    this.setState({ ...this.state, date });
  }

  @autobind
  private _onRadioChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    this.setState({ ...this.state, selectedOption: option.key });
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return null; // currently null for error reduction only
  }

  @autobind
  private _createSessionLaw(): void {
    this.setState({ ...this.state, showSpinner: true });
    this._getApiToken().then((token: string) => {
      const taskService: TasksServices = new TasksServices(this.props.isLocalEnvironment);
      taskService.createSessionLaw(this.props.httpClient, token, this._bill, this._task, /Approved/gi.test(this.state.selectedOption)).then((task) => {
        this.setState({ ...this.state, sessionLawCreated: true, showSpinner: false });
      });
    });
  }
}
