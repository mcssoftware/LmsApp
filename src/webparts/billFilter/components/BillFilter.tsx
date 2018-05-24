import * as React from "react";
import styles from "./BillFilter.module.scss";
import { IBillFilterProps } from "./IBillFilterProps";
import { escape, cloneDeep } from "@microsoft/sp-lodash-subset";
import { IBillFilterState } from "./IBillFilterState";
import {
  EventEmitter, apiHelper, IBillApi, IBills, ILmsConfigurationApi,
  LmsFormatters, McsUtil, TextTokenReplacement, lmsCookie,
} from "mcs-lms-core";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import {
  autobind,
  TextField,
  PrimaryButton,
  ButtonType,
  Link,
  List,
  FocusZone,
  FocusZoneDirection,
} from "office-ui-fabric-react";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import ILinks from "../../../controls/PropertyPaneLinks/ILinks";

export default class BillFilter extends React.Component<IBillFilterProps, IBillFilterState> {
  private readonly _eventEmitter: EventEmitter = EventEmitter.getInstance();
  private readonly _billsApi: IBillApi;
  public static cookieName: string = "Bill";
  constructor(props: IBillFilterProps, context?: any) {
    super(props, context);
    this.state = {
      billSearch: "",
      bill: null,
      links: cloneDeep(props.links),
    };
    this._billsApi = apiHelper.getBillsApi(props.isLocalEnvironment);
  }

  public componentDidMount(): void {
    const queryParameters: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
    if (queryParameters.getValue("lsonumber")) {
      const lsonumber: string = queryParameters.getValue("lsonumber").toUpperCase();
      this._expandBill(lsonumber, true);
    } else {
      const billCookie: string | undefined = lmsCookie.tryGetCookie(BillFilter.cookieName);
      const bill: IBills = billCookie ? JSON.parse(billCookie) : undefined;
      if (bill) {
        this._expandBill(bill.LSONumber, false);
        // this._eventEmitter.emit("Bill", { Items: bill });
      }
    }
  }

  public render(): React.ReactElement<IBillFilterProps> {
    return (
      <div className={styles.billFilter}>
        <div className={styles.container}>
          <WebpartHeader webpartTitle="Bill Filter" />
          <div className={styles.content}>
            <div className={styles.row}>
              <div className={styles.column6}>
                <TextField className={styles.inlineflex + " " + styles.textBox} label="Bill/Lso Number"
                  ariaLabel="Enter Bill/Lso number ..."
                  placeholder="Enter Bill/Lso number ..."
                  value={this.state.billSearch}
                  autoComplete="off"
                  onKeyPress={this._onKeyPressed}
                  onChanged={this._onTextChanged} />
                <PrimaryButton className={styles.inlineflex + " " + styles.searchButton}
                  ariaLabel="Submit lsonumber"
                  onClick={this._onClick}>Submit</PrimaryButton>
              </div>
              <div className={styles.column6}>
                <FocusZone className={styles.linkcolumn} direction={FocusZoneDirection.vertical}>
                  <div className="ms-ListGhostingExample-container" data-is-scrollable={true}>
                    <List items={this.state.links} onRenderCell={this._onRenderCell} />
                  </div>
                </FocusZone>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private _onRenderCell(item: ILinks, index: number): JSX.Element {
    return (
      <div className="ms-ListGhostingExample-itemCell" data-is-focusable={true}>
        <div className="ms-ListGhostingExample-itemContent">
          <Link href={item.url}>{item.text}</Link>
        </div>
      </div>
    );
  }

  @autobind
  private _onKeyPressed(event: any): void {
    const keyCode: number = (event.keyCode ? event.keyCode : event.which);
    if (keyCode === 13) {
      event.preventDefault();
      this._expandBill(this.state.billSearch, false);
    }
  }

  @autobind
  private _onTextChanged(newValue: string): void {
    this.setState({
      ...this.state,
      billSearch: newValue,
      bill: null,
    });
  }

  @autobind
  private _onClick(): void {
    this._expandBill(this.state.billSearch, false);
  }

  private _expandBill(lsonumber: string, redirect: boolean): void {
    const configApi: ILmsConfigurationApi = apiHelper.getConfigurationApi(this.props.isLocalEnvironment);
    LmsFormatters.LsoOrBillNumber(lsonumber, configApi).then((resolvedValue) => {
      this._billsApi.getBill(resolvedValue).then((billResult: IBills) => {
        lmsCookie.setCookie(BillFilter.cookieName, JSON.stringify({
          LSONumber: billResult.LSONumber,
          BillNumber: billResult.BillNumber,
          Id: billResult.Id,
        }), { path: "/", expires: McsUtil.dateAdd(new Date(), "days", 5) });
        if (redirect) {
          window.location.href = window.location.href.split("?")[0];
        } else {
          this.setState({
            ...this.state,
            billSearch: this.props.showBillNumber ? billResult.BillNumber : billResult.LSONumber,
            bill: billResult,
            links: this._getLinks(billResult),
          });
          this._eventEmitter.emit("Bill", { Items: billResult });
        }
      }, (err) => {
        this.setState({
          ...this.state,
          billSearch: resolvedValue,
          bill: null,
          links: this._getLinks(null),
        });
        this._eventEmitter.emit("Bill", { Items: null });
      });
    });
  }

  private _getLinks(bill: IBills): ILinks[] {
    const links: ILinks[] = cloneDeep(this.props.links);
    if (bill) {
      const tokenReplacement: TextTokenReplacement = new TextTokenReplacement();
      tokenReplacement.addToken("WebUrl", this.props.webUrl);
      tokenReplacement.addToken("LsoNumber", bill.LSONumber);
      tokenReplacement.addToken("BillNumber", bill.BillNumber);
      tokenReplacement.addToken("BillId", bill.Id.toString());
      links.forEach((l) => {
        l.text = tokenReplacement.performTokenReplacement(l.text);
        l.url = tokenReplacement.performTokenReplacement(l.url);
      });
      return links;
    }
    return links;
  }
}
