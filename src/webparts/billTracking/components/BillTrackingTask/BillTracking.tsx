import * as React from "react";
import styles from "./BillTracking.module.scss";
import lmsTaskStyles from "../../../lmsTask/components/LmsTask.module.scss";
import { clone } from "@microsoft/sp-lodash-subset";
import {
  autobind,
  Label,
  Dropdown, IDropdownOption,
} from "office-ui-fabric-react";

import { IBillTrackingProps } from "./IBillTrackingProps";
import { IBillTrackingState } from "./IBillTrackingState";
import { Loading } from "../../../../controls/Loading/Loading";
import WebpartHeader from "../../../../controls/WebpartHeader/WebpartHeader";
import {
  ITasks, ITaskAction, IWorkflowDefinition, IBills, McsUtil,
  WorkflowLogic, IBillApi, apiHelper,
} from "mcs-lms-core";
import LmsTask from "../../../lmsTask/components/LmsTask";
import { ActionForm } from "../ActionForm/ActionForm";
import { Chamber } from "mcs-lms-core/lib/services/WorkflowLogic";

export default class BillTracking extends React.Component<IBillTrackingProps, IBillTrackingState> {
  private _task: ITasks;
  private _taskActions: ITaskAction[];

  constructor(props: any, context: any) {
    super(props, context);
    this._taskActions = [];
  }

  public render(): React.ReactElement<IBillTrackingProps> {
    const { title } = this.props;
    const { Task, Token } = this.state;
    return (
      <div className={styles.billTracking}>
        <div className={styles.row}>
          <div className={styles.column6}>
            <ActionForm
              isLocalEnvironment={this.props.isLocalEnvironment}
              task={Task}
              httpClient={this.props.httpClient}
              token={Token}
              taskActions={this._getTaskAction} />
          </div>
          <div className={styles.column6}>
            <LmsTask
              title={title}
              isLocalEnvironment={this.props.isLocalEnvironment}
              spHttpClient={this.props.spHttpClient}
              preTaskCompletionAction={this._preTaskCompletionAction}
              postComponentMount={this._postComponentMount}
              showTaskAction={this._canCompleteTask()}
              showSpinner={false}
            />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks, getApiToken?: () => Promise<string>): void {
    this._task = task;
    this._task.BillLookup = bill;
    getApiToken().then((token) => {
      this.setState({ ...this.state, Task: task, Token: token });
    });
  }

  @autobind
  private _getTaskAction(actions: ITaskAction[]): void {
    if (McsUtil.isArray(actions)) {
      this._taskActions = actions;
      this.setState({ ...this.state });
    }
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return new Promise<ITasks>((resolve, reject) => {
      const step: IWorkflowDefinition = this._task.WorkflowStep;
      const bill: IBills = this._task.BillLookup;
      if (WorkflowLogic.IsVetoOverrideStep(step) || WorkflowLogic.IsJccTask(step, bill)) {
        resolve(this._task);
      } else {
        const chamber: Chamber = WorkflowLogic.getChamberForStep(step);
        const hasAmendmentAction: boolean = this._taskActions.filter((f) => McsUtil.isDefined(f.AmendmentLookupId)).length > 0;
        if (hasAmendmentAction && chamber !== Chamber.None) {
          const billOfOrigin: Chamber = WorkflowLogic.getHouseOfOriginForBill(bill);
          let needToUpdateBill: boolean = false;
          const propertyToUpdate: IBills = {} as IBills;
          if (billOfOrigin === Chamber.House && !bill.HouseAmendments) {
            needToUpdateBill = true;
            propertyToUpdate.HouseAmendments = true;
          }
          if (billOfOrigin === Chamber.Senate && !bill.SenateAmendments) {
            needToUpdateBill = true;
            propertyToUpdate.SenateAmendments = true;
          }
          if (needToUpdateBill) {
            const billsApi: IBillApi = apiHelper.getBillsApi(this.props.isLocalEnvironment);
            billsApi.updateBillNoBlob(bill, propertyToUpdate, "Amendment actions posted.", false)
              .then((newBill: IBills) => {
                this._task.BillLookup = newBill;
                resolve(this._task);
              });
          } else {
            resolve(this._task);
          }
        } else {
          resolve(this._task);
        }
      }
    });
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

  private _canCompleteTask(): boolean {
    if (McsUtil.isDefined(this._task)) {
      if (WorkflowLogic.IsJccTask(this._task.WorkflowStep, this._task.BillLookup) || WorkflowLogic.IsVetoOverrideStep(this._task.WorkflowStep)) {
        return this._taskActions.length > 0;
      }
      const billTaskActions: ITaskAction[] = this._taskActions.filter((t) => !McsUtil.isDefined(t.AmendmentLookupId));
      return billTaskActions.length > 0;
    }
    return false;
  }
}
