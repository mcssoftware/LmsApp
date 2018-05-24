import * as React from "react";
import styles from "./AssignFiscalAnalyst.module.scss";
import { IAssignFiscalAnalystProps } from "./IAssignFiscalAnalystProps";
import { clone } from "@microsoft/sp-lodash-subset";
import { IAssignFiscalAnalystState } from "./IAssignFiscalAnalystState";
import LmsTask from "../../lmsTask/components/LmsTask";
import {
  autobind,
  PrimaryButton,
  Label,
  Dropdown,
  IDropdownOption,
  IPersonaProps,
} from "office-ui-fabric-react";
import { ITasks, IBills, McsUtil } from "mcs-lms-core";
import { SiteUserProps } from "sp-pnp-js";
import LmsPeoplePicker from "../../../controls/PeoplePicker/LmsPeoplePicker";
import { TasksServices } from "../../../services/TasksService";

export default class AssignFiscalAnalyst extends React.Component<IAssignFiscalAnalystProps, IAssignFiscalAnalystState> {
  private _taskService: TasksServices;
  private _options: any = [
    { key: "Create Agency Request", text: "Create Agency Request" },
    { key: "Attorney review, revision", text: "Attorney review, revision" },
    { key: "Create Fiscal Note", text: "Create Fiscal Note" },
    { key: "Obtain Sponsor Approval", text: "Obtain Sponsor Approval" },
    { key: "Cancel Draft, Folder to Bill Processing", text: "Cancel Draft, Folder to Bill Processing" },
  ];

  private _preTaskActionCompleted: boolean;
  private _task: ITasks;
  private _bill: IBills;
  private _selectedUserId: number;
  constructor(props: IAssignFiscalAnalystProps, context: any) {
    super(props, context);
    this._taskService = new TasksServices(props.isLocalEnvironment);
    this.state = {
      selectedDropdownOption: "Create Agency Request",
      selectedFiscalAnalyst: null,
      fiscalAnalystAssigned: false,
      showSpinner: false,
    };
  }

  public render(): React.ReactElement<IAssignFiscalAnalystProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        showTaskSpecificSection={!this.state.fiscalAnalystAssigned}
        showTaskAction={this.state.fiscalAnalystAssigned}
        postComponentMount={this._postComponentMount}
        showSpinner={this.state.showSpinner} />
    );
  }

  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    return (
      <div className={styles.assignFiscalAnalyst}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Label>Assign the fiscal analyst for this bill.</Label>
          </div>
          <div className={styles.column12}>
            <div className={styles.column6}>
              <LmsPeoplePicker
                selectedUser={this._getAssignedTo()}
                label="Fiscal Analyst"
                disabled={false}
                spHttpClient={this.props.spHttpClient}
                principalTypeUser={true}
                principalTypeSharePointGroup={false}
                principalTypeDistributionList={false}
                principalTypeSecurityGroup={false}
                isLocalEnvironment={this.props.isLocalEnvironment}
                onchange={this._onPeopleAssignedToStep} />
            </div>
            <div className={styles.column6}>
              <PrimaryButton className={styles.buttonAssignFiscalAnalyst} text="Assign Fiscal Analyst" onClick={this._assignFiscalAnalyst} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks): void {
    this._bill = bill;
    this._task = task;
    if (McsUtil.isDefined(bill.FiscalAnalystUserId) && McsUtil.isNumberString(bill.FiscalAnalystUserId.toString())) {
      this.setState({ ...this.state, fiscalAnalystAssigned: true });
    }
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return null;
  }

  @autobind
  private _onDropdownChanged(option: IDropdownOption, index?: number): void {
    let currentSelection: string = clone(this.state.selectedDropdownOption);
    currentSelection = option.key.toString();
    this.setState({
      ...this.state,
      selectedDropdownOption: currentSelection,
    });
  }

  @autobind
  private _getAssignedTo(): IPersonaProps[] {
    if (McsUtil.isArray(this.state.selectedFiscalAnalyst)) {
      return this.state.selectedFiscalAnalyst;
    }
    return [];
  }

  @autobind
  private _onPeopleAssignedToStep(users: SiteUserProps[], items: IPersonaProps[]): void {
    let newUser: any = null;
    let newPersona: IPersonaProps = null;
    if (users.length > 0) {
      newUser = { Id: users[0].Id, EMail: users[0].Email, Title: users[0].Title };
      this._selectedUserId = users[0].Id;
      newPersona = items[0];
    }
    this.setState({
      ...this.state,
      selectedFiscalAnalyst: items,
    });
  }

  @autobind
  private _assignFiscalAnalyst(): void {
    const users: IPersonaProps[] = clone(this.state.selectedFiscalAnalyst);
    this.setState({ ...this.state, showSpinner: true });
    if (users.length > 0) {
      this._taskService.assignFiscalAnalyst(this._bill, this._selectedUserId).then((result: IBills) => {
        this._bill = result;
        window.location.reload();
      });
    }
  }
}
