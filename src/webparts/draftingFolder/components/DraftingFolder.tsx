import * as React from "react";
import styles from "./DraftingFolder.module.scss";
import { IDraftingFolderProps } from "./IDraftingFolderProps";
import { escape, clone } from "@microsoft/sp-lodash-subset";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import {
  autobind,
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  IColumn,
  Link,
  MarqueeSelection,
  ActionButton,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  TextField,
} from "office-ui-fabric-react";
import {
  McsUtil, IFile, EventEmitter, IBills, IListSelection, IList,
  IDocumentItem, IListItem, Constants, apiHelper, IBillApi, tokenProvider,
} from "mcs-lms-core";
import pnp from "sp-pnp-js";
import { FiscalFormService, getFiscalUrl, FiscalType } from "../../../services/FiscalFormService";
import { FileNameColumn } from "../../../controls/FileNameColumn/FileNameColumn";
import SpinnerControl from "../../../controls/Loading/SpinnerControl";
import { ListService } from "../../../services/ListService";

export interface IDraftingFolderState {
  columns: IColumn[];
  items: IDocument[];
  selectionDetails: string;
  isModalSelection: boolean;
  isCompactMode: boolean;
  signedIn?: boolean;
  //  hasToken?: boolean;
  error?: string;
  hideDialog: boolean;
  comments: string;
}

export interface IDocument {
  [key: string]: any;
  documentType: string;
  title: string;
  url: string;
  iconName: string;
  modifiedBy: string;
  dateModified: string;
  dateModifiedValue: number;
  version: string;
  listId: string;
  File: IFile;
}

export default class DraftingFolder extends React.Component<IDraftingFolderProps, IDraftingFolderState> {
  private _selection: Selection;
  private readonly _eventEmitter: EventEmitter = EventEmitter.getInstance();
  private _bill: IBills;
  private _hasToken: boolean;
  private _authCtx: adal.AuthenticationContext;
  private _spinner: SpinnerControl;

  constructor(props: any) {
    super(props);
    const _columns: IColumn[] = [
      {
        key: "column1",
        name: "Document Type",
        fieldName: "documentType",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        onColumnClick: this._onColumnClick,
        data: "string",
        onRender: (item: IDocument) => {
          return (
            <span>
              {item.documentType}
            </span>
          );
        },
        isPadded: true,
      },
      {
        key: "column2",
        name: "Title",
        fieldName: "title",
        minWidth: 210,
        maxWidth: 350,
        isRowHeader: true,
        isResizable: true,
        isSorted: true,
        isSortedDescending: false,
        onColumnClick: this._onColumnClick,
        data: "string",
        isPadded: true,
        onRender: (item: IDocument) => {
          return (
            <div>
              {McsUtil.isDefined(item.File) && <FileNameColumn item={item} showVersion={true} listId={item.listId} />}
              {!McsUtil.isDefined(item.File) && <Link href={item.url}>{item.title}</Link>}
            </div>
          );
        },
      },
      {
        key: "column3",
        name: "Date Modified",
        fieldName: "dateModifiedValue",
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        onColumnClick: this._onColumnClick,
        data: "number",
        onRender: (item: IDocument) => {
          return (
            <span>
              {item.dateModified}
            </span>
          );
        },
        isPadded: true,
      },
      {
        key: "column4",
        name: "Modified By",
        fieldName: "modifiedBy",
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        isCollapsable: true,
        data: "string",
        onColumnClick: this._onColumnClick,
        onRender: (item: IDocument) => {
          return (
            <span>
              {item.modifiedBy}
            </span>
          );
        },
        isPadded: true,
      },
      {
        key: "column5",
        name: "Version",
        fieldName: "version",
        minWidth: 70,
        maxWidth: 90,
        isResizable: true,
        isCollapsable: true,
        data: "string",
        onColumnClick: this._onColumnClick,
        onRender: (item: IDocument) => {
          return (
            <span>
              {item.version}
            </span>
          );
        },
      },
    ];

    this._hasToken = false;
    this._selection = new Selection({
      onSelectionChanged: () => {
        this.setState({
          ...this.state,
          selectionDetails: this._getSelectionDetails(),
          isModalSelection: this._selection.isModal(),
        });
      },
    });
    this.state = {
      items: [],
      columns: _columns,
      selectionDetails: this._getSelectionDetails(),
      isModalSelection: this._selection.isModal(),
      isCompactMode: true,
      hideDialog: true,
      comments: "",
    };
  }

  public componentDidMount(): void {
    this._eventEmitter.on("Bill", (value) => {
      this._bill = McsUtil.isDefined(value) && McsUtil.isDefined(value.Items) ? clone(value.Items) : null;
      if (this._hasToken) {
        tokenProvider.getToken().then((token) => {
          this._hasToken = true;
          this._loadData(token);
        }, (err) => {
          this._hasToken = false;
        });
      } else {
        this._loadData("");
      }
    });
    this._authCtx.handleWindowCallback();
    if (window !== window.top) {
      return;
    }
    this.setState({ ...this.state, signedIn: !(!this._authCtx.getCachedUser()) });
  }

  public render(): React.ReactElement<IDraftingFolderProps> {
    const { columns, isCompactMode, items, selectionDetails } = this.state;
    const { title } = this.props;
    return (
      <div className={styles.draftingFolder}>
        <div className={styles.container}>
          <WebpartHeader webpartTitle={title} />
          <div className={styles.content}>
            {this.props.canCreateNewVersion && McsUtil.isDefined(this._bill) &&
              <div className={styles.row}>
                <div className={styles.column12}>
                  <ActionButton iconProps={{ iconName: "DocumentApproval" }} onClick={this._showDialog} >
                    Create new version of bill
            </ActionButton>
                </div>
              </div>
            }
            <div className={styles.row}>
              <div className={styles.column12}>
                {this.state.items &&
                  <DetailsList
                    items={this.state.items}
                    compact={isCompactMode}
                    columns={columns}
                    setKey="set"
                    layoutMode={DetailsListLayoutMode.justified}
                    isHeaderVisible={true}
                    selection={this._selection}
                    selectionPreservedOnEmptyClick={true}
                    onItemInvoked={this._onItemInvoked}
                    enterModalSelectionOnTouch={true}
                  />
                }
              </div>
            </div>
            <Dialog
              className={styles.dialog}
              hidden={this.state.hideDialog}
              onDismiss={this._closeDialog}
              dialogContentProps={{
                type: DialogType.close,
                title: "New Version",
                subText: this._getDialodSubtext(),
              }}
              modalProps={{
                titleAriaId: "myLabelId",
                subtitleAriaId: "mySubTextId",
                isBlocking: false,
                containerClassName: "ms-dialogMainOverride",
              }}
            >
              <TextField
                label="Version Comments"
                multiline
                rows={4}
                onChanged={this._commentsChanged}
              />
              <DialogFooter>
                <PrimaryButton onClick={this._createNewVersionClicked} text="Yes" />
                <DefaultButton onClick={this._closeDialog} text="No" />
              </DialogFooter>
              <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  public componentDidUpdate(prevProps: IDraftingFolderProps, prevState: IDraftingFolderState, prevContext: any): void {
    const isUserSignedIn: boolean = !(!this._authCtx.getCachedUser());
    const loginError: any = this._authCtx.getLoginError();
    if (!isUserSignedIn && !loginError) {
      this._authCtx.login();
    } else {
      if (prevState.signedIn !== this.state.signedIn && !this._hasToken) {
        tokenProvider.getToken().then((token) => {
          this._hasToken = true;
          this._loadData(token);
        }, (err) => {
          this._hasToken = false;
        });
      }
    }
  }

  private _loadData(token: string): void {
    if (McsUtil.isArray(this.props.lists)) {
      Promise.all(this.props.lists.map((l) => {
        return this._getListItems(l, token);
      })).then((response: IDocument[][]) => {
        let tempItems: IDocument[] = [];
        response.forEach((documentResponses: IDocument[]) => {
          if (documentResponses.length > 0) {
            tempItems = tempItems.concat(documentResponses);
          }
        });
        this.setState({
          ...this.state,
          items: tempItems,
        });
      });
    }
  }

  private _getListItems(list: IListSelection, token: string): Promise<IDocument[]> {
    return new Promise<IDocument[]>((resolve, reject) => {
      if (McsUtil.isDefined(this._bill)) {
        const fiscalForm: IList[] = ListService.getMockFiscalList().filter((f) => f.Id === list.Id);
        if (fiscalForm.length > 0) {
          let fiscalFormType: FiscalType;
          switch (list.Title) {
            case "Fiscal Form": fiscalFormType = FiscalType.FiscalNote; break;
            case "Fiscal Impact": fiscalFormType = FiscalType.FiscalImpactRequest; break;
            case "Fiscal Directive": fiscalFormType = FiscalType.FiscalDirective; break;
          }
          if (this._hasToken && McsUtil.isDefined(fiscalFormType)) {
            const fiscalService: FiscalFormService = new FiscalFormService(fiscalFormType);
            const fiscalFilter: string = `LsoNumber eq ${this._bill.LSONumber}`;
            fiscalService.getItems(this.props.httpClient, token, fiscalFilter, ["Id", "Modifiedby", "ModifiedDate"], [""])
              .then((fiscalResult) => {
                if (McsUtil.isArray(fiscalResult) && fiscalResult.length > 0) {
                  const documentType: string = "Fiscal";
                  const title: string = `${list.Title} ${this._bill.LSONumber}`;
                  const url: string = getFiscalUrl(fiscalFormType, this._bill.LSONumber);
                  const iconName: string = "OfficeFormsLogo";
                  const modifiedBy: string = (fiscalResult[0] as any).Modifiedby;
                  const dateModified: string = (fiscalResult[0] as any).ModifiedDate;
                  const dateModifiedValue: Date = new Date(dateModified);
                  const version: string = "";
                  return {
                    documentType,
                    title,
                    url,
                    iconName,
                    modifiedBy,
                    dateModified,
                    dateModifiedValue: dateModifiedValue.getTime(),
                    version,
                  } as IDocument;
                } else {
                  resolve([]);
                }
              }, () => {
                resolve([]);
              });
          } else {
            resolve([]);
          }
        } else {
          ListService.getDraftingDesktopData(this.props.webUrl, list, this.getFilter(list.searchField, list.fieldType))
            .then((listItem) => {
              resolve(listItem.map((item) => {
                const title: string = list.BaseTemplate === 101 ? (item as IDocumentItem).File.Name : item.Title;
                const iconName: string = list.BaseTemplate === 101 ? this._getIconFromFileName(title) : "";
                const modifiedBy: string = (item as IListItem).Editor.Title;
                const url: string = list.BaseTemplate === 101 ? (item as IDocumentItem).File.LinkingUrl : ListService.getLinkUrl(this.props.webUrl, list.Title, list.Id, item);
                const dateModifiedValue: Date = new Date(item.Modified as string);
                const dateModified: string = dateModifiedValue.toLocaleDateString();
                const documentType: string = this._getDocumentType(list, item);
                const listId: string = list.Id;
                let version: string = "";
                if (list.BaseTemplate === 101) {
                  if (list.Title === Constants.Lists.Bills) {
                    version = (item as IBills).DocumentVersion.toString();
                  } else {
                    version = (item as IDocumentItem).File.UIVersionLabel;
                  }
                }
                return {
                  documentType,
                  title,
                  url,
                  iconName,
                  modifiedBy,
                  dateModified,
                  dateModifiedValue: dateModifiedValue.getTime(),
                  version,
                  listId,
                  File: (item as any).File,
                } as IDocument;
              }));
            }, () => {
              resolve([]);
            });

        }
      } else {
        resolve([]);
      }
    });
  }

  private _getDocumentType(list: IListSelection, item: IListItem): string {
    if (item.ContentType.Name !== "Item" && item.ContentType.Name !== "Document") {
      return item.ContentType.Name;
    }
    return list.Title;
  }

  private _getIconFromFileName(fileName: string): string {
    if (McsUtil.isString(fileName)) {
      const fileExtensionPattern: RegExp = /\.([0-9a-z]+)(?:[\?#]|$)/i;
      const m1: RegExpMatchArray | null = fileName.match(fileExtensionPattern);
      if (m1 != null) {
        return m1[1].toLowerCase();
      }
    }
    return "";
  }

  private getFilter(fieldName: string, fieldType: string): string {
    if (McsUtil.isDefined(this._bill)) {
      if (/lookup/gi.test(fieldType)) {
        return `${fieldName}Id eq ${this._bill.Id}`;
      }
      return `${fieldName} eq '${this._bill.LSONumber}'`;
    } else {
      return `${fieldName} eq 'billnotdefined'`;
    }
  }

  private _getSelectionDetails(): string {
    const selectionCount: number = this._selection.getSelectedCount();
    switch (selectionCount) {
      case 0:
        return "No items selected";
      case 1:
        return "1 item selected: " + (this._selection.getSelection()[0] as any).name;
      default:
        return `${selectionCount} items selected`;
    }
  }

  private _onItemInvoked(item: any): void {
    // alert(`Item invoked: ${item.name}`);
  }

  private _getDialodSubtext(): string {
    if (this.state.hideDialog) {
      return "";
    }
    if (McsUtil.isDefined(this._bill)) {
      const billsApi: IBillApi = apiHelper.getBillsApi(this.props.isLocalEnvironment);
      return `Would you like to create a new version ${billsApi.getDocumentVersion(this._bill.DocumentVersion, false)} of ${this._bill.LSONumber}?`;
    }
    return "";
  }

  @autobind
  private _onColumnClick(ev: React.MouseEvent<HTMLElement>, column: IColumn): void {
    const { columns, items } = this.state;
    let newItems: IDocument[] = items.slice();
    const newColumns: IColumn[] = columns.slice();
    const currColumn: IColumn = newColumns.filter((currCol: IColumn, idx: number) => {
      return column.key === currCol.key;
    })[0];
    newColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });
    newItems = this._sortItems(newItems, currColumn.fieldName, currColumn.isSortedDescending);
    this.setState({
      ...this.state,
      columns: newColumns,
      items: newItems,
    });
  }

  @autobind
  private _sortItems(items: IDocument[], sortBy: string, descending: boolean = false): IDocument[] {
    if (descending) {
      return items.sort((a: IDocument, b: IDocument) => {
        if (a[sortBy] < b[sortBy]) {
          return 1;
        }
        if (a[sortBy] > b[sortBy]) {
          return -1;
        }
        return 0;
      });
    } else {
      return items.sort((a: IDocument, b: IDocument) => {
        if (a[sortBy] < b[sortBy]) {
          return -1;
        }
        if (a[sortBy] > b[sortBy]) {
          return 1;
        }
        return 0;
      });
    }
  }

  @autobind
  private _showDialog(): void {
    this.setState({ ...this.state, hideDialog: false });
  }

  @autobind
  private _closeDialog(): void {
    this.setState({ ...this.state, hideDialog: true, comments: "" });
  }

  @autobind
  private _createNewVersionClicked(): void {
    this._createVersion(this.state.comments || "");
    // this.setState({ ...this.state, hideDialog: true, comments: "" });
  }

  @autobind
  private _commentsChanged(newvalue: string): void {
    this.setState({ ...this.state, comments: newvalue });
  }

  private _createVersion(newvalue: string): void {
    this._spinner.setVisibility(true);
    const billsApi: IBillApi = apiHelper.getBillsApi(this.props.isLocalEnvironment);
    const propertyToUpdate: IBills = {
      DocumentVersion: billsApi.getDocumentVersion(this._bill.DocumentVersion, false),
    } as IBills;
    billsApi.updateBillNoBlob(this._bill, propertyToUpdate, this.state.comments, false)
      .then(() => {
        this._spinner.setVisibility(false);
        window.location.reload();
      });
  }
}
