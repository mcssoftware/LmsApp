import * as React from "react";
import styles from "./ElementsDetail.module.scss";
import { IElementsDetailProps } from "./IElementsDetailProps";
import { IElementsDetailState } from "./IElementsDetailState";
import Form from "../form/Form";
import {
  IElementsAffected,
  IBills,
  McsUtil,
  tokenProvider,
} from "mcs-lms-core";
import { BillsService } from "../../../../services/BillsService";
import UrlQueryParameterCollection from "@microsoft/sp-core-library/lib/url/UrlQueryParameterCollection";
import { ElementsAffectedService } from "../../../../services/ElementsAffectedService";
import { Loading, Error } from "../../../../controls/Loading/Loading";
import {
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
  IColumn,
  DefaultButton,
  autobind,
  TextField,
} from "office-ui-fabric-react";
import { clone } from "@microsoft/sp-lodash-subset";
import WebpartHeader from "../../../../controls/WebpartHeader/WebpartHeader";
import SpinnerControl from "../../../../controls/Loading/SpinnerControl";

export default class ElementsDetail extends React.Component<IElementsDetailProps, IElementsDetailState> {
  private _billsService: BillsService;
  private _elementsAffectedService: ElementsAffectedService;
  private _selection: Selection;
  private _authCtx: adal.AuthenticationContext;
  private _spinner: SpinnerControl;

  constructor(props: IElementsDetailProps, context?: any) {
    super(props);
    this._selection = new Selection({
      onSelectionChanged: () => {
        this.setState({
          ...this.state,
          deleteDisabled: this._selection.getSelectedCount() !== 1,
        });
      },
    });
    this.state = {
      loading: true,
      error: "",
      bill: null,
      elementsAffected: [],
      deleteDisabled: true,
      signedIn: false,
    };
  }

  public componentDidMount(): void {
    this._authCtx.handleWindowCallback();
    if (window !== window.top) {
      return;
    }
    this.setState({ ...this.state, error: this._authCtx.getLoginError(), signedIn: !(!this._authCtx.getCachedUser()) });
  }

  public render(): React.ReactElement<IElementsDetailProps> {
    const { httpClient } = this.props;
    return (
      <div className={styles.elementsAffected}>
        <div className={styles.container}>
          <WebpartHeader webpartTitle="Elements Affected" />
          {this.state.loading && (<Loading />)}
          {!this.state.loading && (this.state.error !== "") && (<Error message={this.state.error} />)}
          {!this.state.loading && (this.state.error === "") && (
            <div>
              <Form bill={this.state.bill}
                isLocalEnvironment={this.props.isLocalEnvironment}
                webAbsoluteUrl={this.props.webAbsoluteUrl}
                onElementsAddClicked={this._onElementsAddClicked}
                httpClient={httpClient} />
              <div className={styles.separator}></div>
              <DefaultButton
                disabled={this.state.deleteDisabled}
                onClick={this._deleteItem}
                text="Delete an item"
              />
              {/* <DefaultButton
                disabled={this.state.elementsAffected.length === 0}
                onClick={this._insertIntoDocument}
                text="Print"
              /> */}
              <DefaultButton
                disabled={this.state.elementsAffected.length === 0}
                onClick={this._insertIntoDocument}
                text="Insert Elements to Word Document"
              />
              <DefaultButton
                disabled={this.state.elementsAffected.length === 0}
                onClick={this._insertIntoDocument}
                text="Sync elements affected"
              />
              <div className={styles.row}>
                <div className={styles.searchColumn}>
                  <TextField className={styles.searchBox} label="Search" onBeforeChange={this._onFilterChanged} />
                </div>
              </div>
              <DetailsList compact={true}
                items={this._getFilterItems()}
                columns={this._onGetColumns()}
                selection={this._selection}
                selectionMode={SelectionMode.single}
                layoutMode={DetailsListLayoutMode.justified}
                isHeaderVisible={true} />
            </div>
          )}
          <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
        </div>
      </div >
    );
  }

  public componentDidUpdate(prevProps: IElementsDetailProps, prevState: IElementsDetailState, prevContext: any): void {
    if (prevState.signedIn !== this.state.signedIn && !McsUtil.isDefined(this.state.hasToken)) {
      tokenProvider.getToken().then((token) => {
        this._getData();
        this.setState({ ...this.state, hasToken: true });
      }, (err) => {
        this.setState({ ...this.state, hasToken: false });
      });
    }
  }

  @autobind
  private _deleteItem(): void {
    const itemToDelete: IElementsAffected = this._selection.getSelection()[0] as IElementsAffected;
    this._elementsAffectedService.deleteElementAffected(itemToDelete).then(() => {
      let index: number = -1;
      for (let i: number = 0; i < this.state.elementsAffected.length; i++) {
        if (this.state.elementsAffected[i].Id === itemToDelete.Id) {
          index = i;
          break;
        }
      }
      if (index >= 0) {
        const allItems: IElementsAffected[] = clone(this.state.elementsAffected);
        allItems.splice(index, 1);
        this.setState({ ...this.state, elementsAffected: allItems });
      }
    });
  }

  @autobind
  private _insertIntoDocument(): void {
    tokenProvider.getToken().then((token) => {
      const recreateSectionTitle: boolean = confirm("Do you want to recreate section Title if it already exists?");
      this._spinner.setVisibility(true);
      this._elementsAffectedService.insertIntoBill(this.props.httpClient, token, this.props.webAbsoluteUrl,
        recreateSectionTitle, this.state.elementsAffected, this.state.bill)
        .then((response) => {
          this._spinner.setVisibility(false);
          this.setState({ ...this.state, bill: response.Bill, elementsAffected: response.ElementAffected });
        }, (err) => {
          this._spinner.setVisibility(false);
          alert(McsUtil.getApiErrorMessage(err));
        });
    });
  }

  @autobind
  private _syncElementsAffected(): void {
    tokenProvider.getToken().then((token) => {
      this._spinner.setVisibility(true);
      this._elementsAffectedService.getElementsAffectedFromBill(this.props.httpClient, token, this.props.webAbsoluteUrl, this.state.bill.Id, this.state.elementsAffected)
        .then((response) => {
          this._spinner.setVisibility(false);
          alert("not implemented.");
        }, (err) => {
          this._spinner.setVisibility(false);
          alert(McsUtil.getApiErrorMessage(err));
        });
    });
  }

  @autobind
  private _printElements(): void {
    // todo
  }

  private _onGetColumns(): IColumn[] {
    const _columns: IColumn[] = [
      {
        key: "column1",
        name: "Type",
        fieldName: "ElementType",
        minWidth: 50,
        maxWidth: 100,
        isRowHeader: true,
        isResizable: true,
        isSorted: true,
        isSortedDescending: false,
        data: "string",
        isPadded: true,
      },
      {
        key: "column2",
        name: "Element",
        fieldName: "Title",
        minWidth: 100,
        maxWidth: 200,
        isRowHeader: true,
        isResizable: true,
        isSorted: true,
        isSortedDescending: false,
        data: "string",
        isPadded: true,
      },
      {
        key: "column3",
        name: "Intro",
        fieldName: "Intro",
        minWidth: 20,
        maxWidth: 35,
        isRowHeader: true,
        isResizable: true,
        isSorted: true,
        isSortedDescending: false,
        data: "boolean",
        isPadded: true,
      }, {
        key: "column4",
        name: "New Element Number",
        fieldName: "NewElementNumber",
        minWidth: 100,
        maxWidth: 200,
        isRowHeader: true,
        isResizable: true,
        isSorted: true,
        isSortedDescending: false,
        data: "string",
        isPadded: true,
      },
    ];
    return _columns;
  }

  @autobind
  private _onElementsAddClicked(elements: IElementsAffected[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._spinner.setVisibility(true);
      const { elementsAffected } = this.state;
      const tempElements: IElementsAffected[] = [];
      elements.forEach((x) => {
        // x.LSONumber = this.state.bill.LSONumber;
        elementsAffected.forEach((y) => {
          if (x.NewElementNumberDbFormat === y.NewElementNumberDbFormat) {
            tempElements.push(x);
          }
        });
      });

      if (tempElements.length < 1) {
        this._elementsAffectedService.insertIntoList(elements).then((items) => {
          this.setState({ ...this.state, elementsAffected: elementsAffected.concat(items) });
          this._spinner.setVisibility(false);
          resolve();
        });
      } else {
        this._spinner.setVisibility(false);
        alert("Some elements are already inserted in this document.");
        reject();
      }
    });
  }

  private _getData(): void {
    if (this.state.signedIn) {
      const queryParameters: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
      this._billsService = new BillsService(this.props.isLocalEnvironment);
      this._elementsAffectedService = new ElementsAffectedService(this.props.isLocalEnvironment);

      let billSearch: string | number;
      if (queryParameters.getValue("billid")) {
        billSearch = parseInt(queryParameters.getValue("billid"), 10);
      } else {
        billSearch = queryParameters.getValue("lsonumber");
      }
      this._billsService.getBill(billSearch)
        .then((bill: IBills) => {
          this._elementsAffectedService.getElementsAffectedForBill(bill.Id)
            .then((elements: IElementsAffected[]) => {
              this.setState({ ...this.state, loading: false, error: "", bill, elementsAffected: elements });
            }, (err) => {
              this.setState({ ...this.state, error: McsUtil.getApiErrorMessage(err), loading: false });
            });
        }, (err) => {
          this.setState({ ...this.state, error: McsUtil.getApiErrorMessage(err), loading: false });
        });
    }
  }

  @autobind
  private _getFilterItems(): any[] {
    const { filterText, elementsAffected } = this.state;
    if (McsUtil.isString(filterText) && filterText.length > 2) {
      const columns: IColumn[] = this._onGetColumns();
      const filterRegex: RegExp = new RegExp(this.state.filterText, "gi");
      return elementsAffected.filter((item) => {
        let canDisplayItem: boolean = false;
        // tslint:disable-next-line:prefer-for-of
        for (let i: number = 0; i < columns.length; i++) {
          const key: string = columns[i].fieldName;
          const value: any = item[key];
          if (typeof value === "string" && value.length > 0 && filterRegex.test(value)) {
            canDisplayItem = true;
            break;
          }
        }
        return canDisplayItem;
      });
    }
    return this.state.elementsAffected;
  }

  @autobind
  private _onFilterChanged(text: string): void {
    this.setState({
      ...this.state,
      filterText: text,
    });
  }
}
