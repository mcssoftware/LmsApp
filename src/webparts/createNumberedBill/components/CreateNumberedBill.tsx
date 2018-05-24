import * as React from "react";
import { clone } from "@microsoft/sp-lodash-subset";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import {
  autobind,
  PrimaryButton,
  Label,
  ChoiceGroup, IChoiceGroupOption,
} from "office-ui-fabric-react";

import styles from "./CreateNumberedBill.module.scss";
import { ICreateNumberedBillProps } from "./ICreateNumberedBillProps";
import { ICreateNumberedBillState } from "./ICreateNumberedBillState";
import { IBills, ITasks, McsUtil, LmsFormatters, Constants } from "mcs-lms-core";
import { TasksServices } from "../../../services/TasksService";
import { BillsService } from "../../../services/BillsService";
import LmsTask from "../../lmsTask/components/LmsTask";
import { SequenceNumbersService } from "../../../services/SequenceNumbersService";

export default class CreateNumberedBill extends React.Component<ICreateNumberedBillProps, ICreateNumberedBillState> {

  private _bills: IBills;
  private _tasks: ITasks;
  private _tasksService: TasksServices;
  private _billService: BillsService;
  private _getApiToken: () => Promise<string>;
  constructor(props: any, context: any) {
    super(props, context);

    this.state = {
      selectedChoice: "0",
      existingBills: [],
      canCreateAppropriationBill: true,
      canCreateBudgetBill: true,
      billNumbered: false,
      showSpinner: false,
    };
    this._tasksService = new TasksServices(props.isLocalEnvironment);
    this._billService = new BillsService(props.isLocalEnvironment);
  }

  public componentDidMount(): void {
    this._billService.getBills("BillNumber eq 'HB0001' or BillNumber eq 'SF0001' or BillNumber eq 'SF0002'",
      ["BillNumber"], "BillNumber").then((billsResult: IBills[]) => {
        if (billsResult.length > 0) {
          const existingBills: string[] = billsResult.map((value) => value.BillNumber);
          const result: any = this._canCreateBills(existingBills);
          this.setState({
            ...this.state,
            existingBills,
            canCreateBudgetBill: result.canCreateBudgetBill,
            canCreateAppropriationBill: result.canCreateAppropriationBill,
          });
        }
      });
  }

  public render(): React.ReactElement<ICreateNumberedBillProps> {
    const { title } = this.props;
    return (
      <LmsTask
        title={title}
        isLocalEnvironment={this.props.isLocalEnvironment}
        spHttpClient={this.props.spHttpClient}
        taskSpecificRender={this._getTaskSpecificRender}
        preTaskCompletionAction={this._preTaskCompletionAction}
        postComponentMount={this._postComponentMount}
        showTaskSpecificSection={!this.state.billNumbered}
        showTaskAction={this.state.billNumbered}
        showSpinner={this.state.showSpinner}
      />
    );
  }

  @autobind
  private _getTaskSpecificRender(): JSX.Element {
    return (
      <div className={styles.createNumberedBill}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill: </Label>
          </div>
          <div className={styles.column12}>
            <ChoiceGroup
              selectedKey={this.state.selectedChoice}
              onChange={this._onChoiceChanged}
              label=""
              options={[
                { key: "0", text: "Other Bills" } as IChoiceGroupOption,
                { key: "1", text: "Budget Bill", disabled: !this.state.canCreateBudgetBill },
                { key: "2", text: "Appropriation for legislature", disabled: !this.state.canCreateAppropriationBill },
              ]}
            />
          </div>
          <div className={styles.column12}>
            <PrimaryButton text="Create Numbered Bill" onClick={this._createNumberedBill} />
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _postComponentMount(bill: IBills, task: ITasks, getApiToken: () => Promise<string>): void {
    this._bills = bill;
    this._tasks = task;
    this._getApiToken = getApiToken;
    const result: any = this._canCreateBills(this.state.existingBills);
    this.setState({
      ...this.state,
      billNumbered: (McsUtil.isDefined(this._bills) && McsUtil.isString(this._bills.BillNumber)) ||
        this._tasksService.getTaskProperties(this._tasks).Numbered,
      canCreateBudgetBill: result.canCreateBudgetBill,
      canCreateAppropriationBill: result.canCreateAppropriationBill,
    });
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return new Promise((resolve, reject) => {
      resolve(this._tasks);
    });
  }

  @autobind
  private _onChoiceChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    let currentChoice: string = clone(this.state.selectedChoice);
    currentChoice = option.key;
    this.setState({
      ...this.state,
      selectedChoice: currentChoice,
    });
  }

  @autobind
  private _createNumberedBill(): void {
    this.setState({ ...this.state, showSpinner: true });
    this._getSequenceNumber().then((newbillNumber: string) => {
      this._getApiToken().then((token: string) => {
        this._tasksService.convertToNumbered(this.props.httpClient, token, this._tasks, this._bills, newbillNumber).then((result) => {
          this.setState({ ...this.state, showSpinner: false });
          window.location.reload();
        });
      });
    });
  }

  private _getSequenceNumber(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const serviceApiService: SequenceNumbersService = new SequenceNumbersService(this.props.isLocalEnvironment);
      const sequenceNumberType: Constants.SequenceNumberType = serviceApiService.getBillNumberSequenceType(this._bills.HouseofOrigin, this._bills.LegislationType);
      if (this.state.selectedChoice !== "0") {
        const formatterBillNumber: string = LmsFormatters.BillNumber(parseInt(this.state.selectedChoice, 10), sequenceNumberType);
        resolve(formatterBillNumber);
      } else {
        serviceApiService.getNextSequenceNumber(sequenceNumberType)
          .then((nextNumber: number) => {
            const formatterBillNumber: string = LmsFormatters.BillNumber(nextNumber, sequenceNumberType);
            resolve(formatterBillNumber);
          });
      }
    });
  }

  private _canCreateBills(existingBill: string[]): any {
    const result: any = {
      canCreateBudgetBill: true,
      canCreateAppropriationBill: true,
    };
    if (McsUtil.isDefined(this._bills)) {
      if (/Senate/gi.test(this._bills.HouseofOrigin)) {
        result.canCreateAppropriationBill = this._bills.LegislationType === "Bill" && existingBill.indexOf("SF0002") < 0;
        result.canCreateBudgetBill = this._bills.LegislationType === "Bill" && existingBill.indexOf("SF0001") < 0;
      } else {
        result.canCreateAppropriationBill = false;
        result.canCreateBudgetBill = this._bills.LegislationType === "Bill" && existingBill.indexOf("HB0001") < 0;
      }
    }
    return result;
  }
}