import * as React from "react";
import styles from "./BillInformation.module.scss";
import { IBillInformationProps } from "./IBillInformationProps";
import { clone } from "@microsoft/sp-lodash-subset";
import { IBillInformationState } from "./IBillInformationState";
import { EventEmitter, McsUtil } from "mcs-lms-core";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import DisplayItem from "../../../controls/DisplayItem/DisplayItem";
import {
  autobind,
  Link,
  Label,
  PrimaryButton,
  ActionButton,
} from "office-ui-fabric-react";
import { BillsService } from "../../../services/BillsService";
import { FileNameColumn } from "../../../controls/FileNameColumn/FileNameColumn";

export default class BillInformation extends React.Component<IBillInformationProps, IBillInformationState> {
  private readonly _eventEmitter: EventEmitter = EventEmitter.getInstance();
  private _billService: BillsService;

  constructor(props: IBillInformationProps, context?: any) {
    super(props, context);
    this.state = {
      isOverlayVisible: false,
      Bill: null,
    };
    this._billService = new BillsService(props.isLocalEnvironment);
  }

  public componentDidMount(): void {
    this._eventEmitter.on("Bill", this._receiveBill.bind(this));
  }

  public render(): React.ReactElement<IBillInformationProps> {
    const { Bill, isOverlayVisible } = this.state;
    return (
      <div className={styles.billInformation}>
        <div className={styles.container}>
          <WebpartHeader webpartTitle="Bill Draft Information" />
          {!McsUtil.isDefined(Bill) && <div className={styles.row}>
            <div className={styles.column12}>
              <Label>Bill is required</Label>
            </div>
          </div>}
          {McsUtil.isDefined(Bill) && <div>
            <div className={styles.row}>
              <div className={styles.column6}>
                <DisplayItem labelText="Bill Number" value={this._getBillNumberText()} className={styles.billNumberDisplayItem}>
                  <FileNameColumn item={Bill} showVersion={false} listId={null} />
                </DisplayItem>
                {Bill.CheckoutUser &&
                  <PrimaryButton onClick={this._checkInBill} text={this._getCheckInText()} disabled={this.props.currentUser.email !== Bill.CheckoutUser.EMail} />
                }
              </div>
              <div className={styles.column6}><DisplayItem labelText="Catch Title" value={Bill.CatchTitle} /></div>
            </div>
            <div className={styles.row}>
              <div className={styles.column6}><DisplayItem labelText="Requestor" value={Bill.Requestor} /></div>
              <div className={styles.column6}><DisplayItem labelText="Sponsor" value={Bill.Sponsor} /></div>
            </div>
            <div className={styles.row}>
              <div className={styles.column6}><DisplayItem labelText="Drafter" value={McsUtil.isDefined(Bill.Drafter) ? Bill.Drafter.Title : ""} /></div>
              <div className={styles.column6}><DisplayItem labelText="House of Origin" value={Bill.HouseofOrigin} /></div>
            </div>
            <div className={styles.row}>
              <div className={styles.column6}><DisplayItem labelText="Legislation Type" value={Bill.LegislationType} /></div>
              <div className={styles.column6}><DisplayItem labelText="Contact Person" value={Bill.ContactPerson} /></div>
            </div>
            {isOverlayVisible && (
              <div>
                <div className={styles.row}>
                  <div className={styles.column6}><DisplayItem labelText="Date Received" value={this._getDateFormat(Bill.DateReceived)} /></div>
                  <div className={styles.column6}><DisplayItem labelText="Bill Disclosed" value={Bill.BillDisclosed} /></div>
                </div>
                <div className={styles.row}>
                  <div className={styles.column6}><DisplayItem labelText="Does bill have fiscal impact?" value={Bill.HasFiscalImpact} /></div>
                  <div className={styles.column6}><DisplayItem labelText="Is it a revenue raising bill?" value={Bill.RevenueRaising ? "Yes" : "No"} /></div>
                </div>
                <div className={styles.row}>
                  <div className={styles.column12}><DisplayItem labelText="Co-sponsor(s)" value={this._getCosponsor()} /></div>
                </div>
              </div>
            )}
            <ActionButton className={styles.actionButton}
              onClick={this._toggleOverlay}
              iconProps={{ iconName: this._getIcon(isOverlayVisible) }}>
              {this._getLinkText(isOverlayVisible)}
            </ActionButton>
          </div>
          }
        </div>
      </div >
    );
  }

  private _getBillNumberText(): string {
    if (McsUtil.isString(this.state.Bill.BillNumber)) {
      return this.state.Bill.BillNumber;
    }
    return this.state.Bill.LSONumber;
  }

  private _getCosponsor(): string {
    if (McsUtil.isString(this.state.Bill.CoSponsor)) {
      return this.state.Bill.CoSponsor.split("#;").join(", ");
    }
    return "";
  }

  @autobind
  private _getCheckInText(): string {
    if (this.props.currentUser.email !== this.state.Bill.CheckoutUser.EMail) {
      return `Checked out by ${this.state.Bill.CheckoutUser.Title}`;
    }
    return "Check-In";
  }

  @autobind
  private _checkInBill(): void {
    this._billService.checkInBill(this.state.Bill, "", false).then(() => {
      window.location.reload(true);
    });
  }

  private _receiveBill(value: any): void {
    this.setState({
      ...this.state,
      isOverlayVisible: this.state.isOverlayVisible,
      Bill: McsUtil.isDefined(value) && McsUtil.isDefined(value.Items) ? clone(value.Items) : null,
    });
  }

  @autobind
  private _toggleOverlay(): void {
    this.setState({
      ...this.state,
      isOverlayVisible: !this.state.isOverlayVisible,
    });
  }

  private _getIcon(isOverlayVisible: boolean): string {
    return isOverlayVisible ? "CaretSolidUp" : "CaretSolidDown";
  }

  private _getLinkText(isOverlayVisible: boolean): string {
    return this.state.isOverlayVisible ? "Show less bill information" : "Show more bill information";
  }

  private _getDateFormat(dateValue: Date | string): string {
    if (McsUtil.isString(dateValue)) {
      return (new Date(dateValue as string)).format("MM/dd/yyyy");
    }
    return "";
  }
}
