import * as React from "react";
import styles from "./CustomListView.module.scss";
import { ICustomListViewProps } from "./ICustomListViewProps";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import { escape } from "@microsoft/sp-lodash-subset";
import { ICustomListViewState } from "./ICustomListViewState";
import { IViewField } from "../../../controls/ListView/IListView";
import {
  autobind,
  SelectionMode,
} from "office-ui-fabric-react";
import { ListView } from "../../../controls/ListView/ListView";
import { IList, IField, IBills, ITasks, IListItem, IDocumentItem, EventEmitter, McsUtil, Constants } from "mcs-lms-core";
import { Loading } from "../../../controls/Loading/Loading";
import { SpFormDialog } from "../../../controls/SpFormDialog/SpFormDialog";
import { ControlMode } from "../../../controls/CustomListForm/ControlMode";
import { ListService } from "../../../services/ListService";

export default class CustomListView extends React.Component<ICustomListViewProps, ICustomListViewState> {
  private readonly _eventEmitter: EventEmitter = EventEmitter.getInstance();

  constructor(props: ICustomListViewProps) {
    super(props);
    this.state = {
      items: [],
      options: null,
      loading: true,
      formDefaultValues: {},
    };

    this._eventEmitter.on("RefreshListView", (value) => {
      if (McsUtil.isDefined(this.state.filterItem) && McsUtil.isDefined(this.state.options)) {
        this._getListItems();
      }
    });
  }

  public componentDidMount(): void {
    this._initializeOptions();
  }

  public render(): React.ReactElement<ICustomListViewProps> {
    const { title, showFilter, canAddItem } = this.props;
    return (
      <div className={styles.customListView}>
        <div className={styles.container}>
          <WebpartHeader webpartTitle={title} />
          <div className={styles.content}>
            <div className={styles.row}>
              {this.state.loading && <Loading />}
              {!this.state.loading && this.state.options != null &&
                <div className={styles.column12}>
                  <ListView
                    iconFieldName={"DocIcon"}
                    items={this.state.items}
                    viewFields={this.state.options.viewFields}
                    compact={true}
                    selectionMode={SelectionMode.single}
                    showFilter={showFilter}
                    selection={this._getSelection}
                    heightCss={this.props.heightCss} />
                  {canAddItem && <SpFormDialog
                    webUrl={this.props.webUrl}
                    listId={this.props.listId}
                    itemId={0}
                    formType={ControlMode.New}
                    formTitle={"Add new item"}
                    defaultValues={this.state.formDefaultValues}
                  />}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  public componentDidUpdate(prevProps: ICustomListViewProps, prevState: ICustomListViewState, prevContext: any): void {
    if (!McsUtil.isDefined(prevState.options) && McsUtil.isDefined(this.state.options)) {
      this._getListItems();
    }
  }

  private _initializeOptions(): void {
    if (McsUtil.isDefined(this.props.webUrl) && McsUtil.isDefined(this.props.listId) && McsUtil.isDefined(this.props.viewId)) {
      ListService.getRestQueryforView(this.props.webUrl, this.props.listId, this.props.viewId)
        .then((response) => {
          if (McsUtil.isString(this.props.filterType)) {
            this._eventEmitter.on(this._getEventType(this.props.filterType), (value) => {
              const previousFilterItem: IListItem = this.state.filterItem || {} as IListItem;
              this.setState({ ...this.state, filterItem: value.Items, loading: true });
              if (McsUtil.isDefined(this.state.options) && McsUtil.isDefined(value.Items) && previousFilterItem.Id !== value.Items.Id) {
                this._getListItems();
              }
            });
          }
          this.setState({
            ...this.state,
            options: response,
            formDefaultValues: this._getDefaultValues(),
          });
        });
    }
  }

  private _getListItems(): void {
    ListService.getData(this.props.webUrl, this.props.listId, this._getListFilter(this.state.options.filter), this.state.options.select,
      this.state.options.expand, this.state.options.order)
      .then((data) => {
        this.setState({
          ...this.state,
          items: data,
          loading: false,
          formDefaultValues: this._getDefaultValues(),
        });
      });
  }

  private _getListFilter(viewFilter: string): string {
    if (McsUtil.isString(this.props.filterType)) {
      let tempFilter: string = "";
      if (McsUtil.isString(viewFilter)) {
        tempFilter = " and " + viewFilter;
      }
      if (McsUtil.isString(this.props.filterField)) {
        if (this.props.filterType === "Bills") {
          const billItem: IBills = this.state.filterItem as IBills;
          if (McsUtil.isDefined(billItem)) {
            if (this.props.filterField.indexOf("Lookup") > 0) {
              return `${this.props.filterField} eq ${billItem.Id}${tempFilter}`;
            }
            if (/lsonumber/gi.test(this.props.filterField)) {
              return `${this.props.filterField} eq ${billItem.LSONumber}${tempFilter}`;
            }
          }
        }
      }
      // invalid filter
      return "Id eq 0";
    }
    return McsUtil.isString(viewFilter) ? viewFilter : "";
  }

  @autobind
  private _getSelection(items: any[]): void {
    const { options } = this.state;
    this._eventEmitter.emit(this._getEventType(options.listProperties.Title), { Items: items });
  }

  private _getEventType(value: string): string {
    switch (value) {
      case Constants.Lists.Bills: return "Bill";
      case Constants.Lists.Tasks: return "Task";
      case Constants.Lists.Amendments: return "Amendment";
      default: return "Other";
    }
  }

  // tslint:disable:object-literal-key-quotes
  private _getDefaultValues(): { [fieldName: string]: string } {
    if (this.props.filterType === "Bills" && this.state.filterItem != null) {
      const billItem: IBills = this.state.filterItem as IBills;
      return {
        "LSONumber": billItem.LSONumber,
        "BillLookup": `${billItem.Id};#${billItem.LSONumber}`,
      };
    }
    return {};
  }
}
