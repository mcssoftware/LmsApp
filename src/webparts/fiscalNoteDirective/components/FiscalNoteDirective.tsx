import * as React from "react";
import styles from "./FiscalNoteDirective.module.scss";
import { IFiscalNoteDirectiveProps } from "./IFiscalNoteDirectiveProps";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import {
  autobind,
  Label,
  Dropdown, IDropdownOption,
  TextField,
  ChoiceGroup, IChoiceGroupOption,
  Checkbox,
  DefaultButton, ActionButton,
} from "office-ui-fabric-react";

import { IFiscalNoteDirectiveState, IFormValidation, IFieldValidation } from "./IFiscalNoteDirectiveState";
import { AgencyControl } from "./AgencyControl";
import { IFiscalDirectiveForm, IFiscalDirectiveAgency } from "./IFiscalDirectiveForm";
import { McsUtil, config, apiHelper, IBillApi, IBills, Constants, IAgencyContact, tokenProvider } from "mcs-lms-core";
import { clone } from "@microsoft/sp-lodash-subset";
import { PeopleService } from "../../../services/PeopleService";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import { Loading, Error } from "../../../controls/Loading/Loading";
import { FiscalFormService, FiscalType } from "../../../services/FiscalFormService";
import SpinnerControl from "../../../controls/Loading/SpinnerControl";

interface IFormControlPermission {
  CanAddAgencies: boolean;
  CanAddOtherComments: boolean;
  CanInputIdenticalLso: boolean;
  CanInputSimilarLso: boolean;
  CanInputPreviousLso: boolean;
}

export default class FiscalNoteDirective extends React.Component<IFiscalNoteDirectiveProps, IFiscalNoteDirectiveState> {
  private _authCtx: adal.AuthenticationContext;
  private readonly _service: FiscalFormService = new FiscalFormService(FiscalType.FiscalDirective);
  private readonly _billApi: IBillApi;
  private _bill: IBills;
  private _allBill: IBills[];
  private _controlPermissions: IFormControlPermission;
  private _uniqueAgencyDdlList: IDropdownOption[];
  private _spinner: SpinnerControl;

  constructor(props: IFiscalNoteDirectiveProps, context?: any) {
    super(props);
    this._bill = null;
    this._allBill = [];
    this._billApi = apiHelper.getBillsApi(false);
    this._uniqueAgencyDdlList = [{ key: "", text: "Select a code" }];
    this._controlPermissions = {
      CanAddAgencies: true,
      CanAddOtherComments: false,
      CanInputIdenticalLso: false,
      CanInputSimilarLso: false,
      CanInputPreviousLso: false,
    };
    this.state = {
      loading: true,
      error: undefined,
      data: null,
      formValidation: {
        IsValid: false,
        FieldValidations: [],
      },
    };
  }

  public componentDidMount(): void {
    this._authCtx.handleWindowCallback();
    if (window !== window.top) {
      return;
    }
    this.setState({ ...this.state, error: this._authCtx.getLoginError(), signedIn: !(!this._authCtx.getCachedUser()) });
  }

  // tslint:disable:max-line-length
  public render(): React.ReactElement<IFiscalNoteDirectiveProps> {
    const { data } = this.state;
    return (
      <div className={styles.fiscalNoteDirective} >
        <div className={styles.container}>
          <WebpartHeader webpartTitle="Fiscal Note Directive" />
          {this.state.loading && (<Loading />)}
          {!this.state.loading && (this.state.error !== "") && (<Error message={this.state.error} />)}
          {!this.state.loading && McsUtil.isDefined(data) && (this.state.error === "") &&
            <div className={styles.row}>
              <div className={styles.column12}>
                <fieldset className={styles.fieldset}>
                  <div className={styles.row}>
                    <div className={styles.column4}>
                      <Label className={styles.header}>LSO Number:</Label><Label>{this._handleLabel(data.LSONumber)}</Label>
                    </div>
                    <div className={styles.column4}>
                      <Label className={styles.header}>Bill Number:</Label><Label>{this._handleLabel(data.BillNumber)}</Label>
                    </div>
                    <div className={styles.column4}>
                      <Label className={styles.header}>Document Version:</Label><Label>{this._handleLabel(data.BillDocumentVersion)}</Label>
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column12}>
                      <Label className={styles.header}>Catch Title:</Label><Label>{this._handleLabel(data.CatchTitle)}</Label>
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column4}>
                      <Label className={styles.header}>Bill Sponsor:</Label><Label>{this._handleLabel(data.Sponsor)}</Label>
                    </div>
                    <div className={styles.column4}>
                      <Label className={styles.header}>Drafter</Label><Label>{this._handleLabel(data.Drafter)}</Label>
                    </div>
                    <div className={styles.column4}>
                      <Label className={styles.header}>Date: </Label><Label>{this._handleDate(data.Date)}</Label>
                    </div>
                  </div>
                </fieldset>
                <fieldset className={styles.fieldset}>
                  <div className={styles.row}>
                    <div className={styles.column12}>
                      <ChoiceGroup className={styles.inlineflex}
                        options={this._getDocumentDispositionOptions()}
                        selectedKey={data.DocumentDisposition}
                        onChange={this._documentDispositionChanged}
                      />
                    </div>
                  </div>
                  {data.DocumentDisposition === "Send For Fiscal Note" && <div className={styles.row}>
                    <div className={styles.column12}>
                      <ChoiceGroup className={styles.fiscalRadio} options={this._getDispositionOptions()} selectedKey={data.SendDisposition}
                        onChange={this._sendDispositionChanged}
                      />
                    </div>
                    <div className={styles.column6DipositionOther}>
                      <TextField readOnly={!this._controlPermissions.CanAddOtherComments} required={!this._controlPermissions.CanAddOtherComments} className={styles.explainFiscal}
                        value={data.OtherCommentsFiscalNote} errorMessage={this._getValidationForField("OtherCommentsFiscalNote")} onChanged={this._onOtherCommentsChanged} />
                    </div>
                  </div>}
                </fieldset>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend} >Information to accompany initial or revised draft sent for the Fiscal Note</legend>
                  <div className={styles.row}>
                    <div className={styles.column12}>
                      <Label className={styles.h4Label}><strong>Bill Drafted:</strong></Label>
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column6}>
                      <ChoiceGroup className={styles.fiscalRadio} selectedKey={data.BillDrafted} options={this._getBillDraftOptions()}
                        onChange={this._onBillDraftChanged} />
                    </div>
                    <div className={styles.column6}>
                      <div className={styles.row}>
                        <div className={styles.column6}>
                          <div className={styles.inlineInput}>
                            <Dropdown label="LSO:" disabled={!this._controlPermissions.CanInputIdenticalLso} required={this._controlPermissions.CanInputIdenticalLso}
                              options={this._getLsoOptions()} errorMessage={this._getValidationForField("IdenticalLSO")}
                              selectedKey={data.IdenticalLSO} onChanged={this._onIdenticalLsoChanged} />
                          </div>
                        </div>
                      </div>
                      <div className={styles.row}>
                        <div className={styles.column6}>
                          <div className={styles.inlineInput}>
                            <Dropdown label="LSO:" disabled={!this._controlPermissions.CanInputSimilarLso} required={this._controlPermissions.CanInputSimilarLso}
                              options={this._getLsoOptions()} errorMessage={this._getValidationForField("SimilarLSO")}
                              selectedKey={data.SimilarLSO} onChanged={this._onSimilarLsoChanged} />
                          </div>
                        </div>
                      </div>
                      <div className={styles.row}>
                        <div className={styles.column6}>
                          <div className={styles.inlineInput}>
                            <TextField label="LSO:" readOnly={!this._controlPermissions.CanInputPreviousLso} required={this._controlPermissions.CanInputPreviousLso}
                              value={data.PreviousLSO} errorMessage={this._getValidationForField("PreviousLSO")}
                              placeholder="eg: 18LSO-0000 ..." onChanged={this._onPreviousLsoChanged} />
                          </div>
                        </div>
                        <div className={styles.column6}>
                          <div className={styles.inlineInput}>
                            <TextField label="Year:" readOnly={!this._controlPermissions.CanInputPreviousLso} required={this._controlPermissions.CanInputPreviousLso}
                              value={data.PreviousYear} errorMessage={this._getValidationForField("PreviousYear")}
                              placeholder="eg: 2017 ..." onChanged={this._onPreviousYearChanged} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>Answer the following questions if this is an initial draft being sent from a Fiscal Note or If the current version may/will change the fiscal impact:</legend>
                  <div className={styles.row}>
                    <div className={styles.column12NoPadding}>
                      <Label className={styles.h4Label}><strong>Does the bill:</strong></Label>
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column12NoPadding}>
                      <ChoiceGroup label="Contain an appropriation?" className={styles.inlineflex + " " + styles.inlineflexInline}
                        selectedKey={data.ContainAppropriation ? "Yes" : "No"}
                        options={this._getChangeOptions()} onChange={this._containAppropriationSelected}
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column12NoPadding}>
                      <ChoiceGroup label="Authorize Additional Personnel" className={styles.inlineflex + " " + styles.inlineflexInline}
                        selectedKey={McsUtil.isString(data.AuthorizeAdditionalPeronnel) ? data.AuthorizeAdditionalPeronnel : "No"}
                        onChange={this._authorizeAdditionalPersonalSelected}
                        options={this._getChangeOptions()}
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column12NoPadding}>
                      <ChoiceGroup label="Change revenue streams" className={styles.inlineflex + " " + styles.inlineflexInline}
                        selectedKey={McsUtil.isString(data.IncreaseDecreaseRevenue) ? data.IncreaseDecreaseRevenue : "No"}
                        onChange={this._revenueChangeSelected}
                        options={this._getChangeOptions()}
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column12NoPadding}>
                      <ChoiceGroup label="Increase or decrease expenditures related to program operation or implementation?"
                        className={styles.inlineflex + " " + styles.inlineflexInline}
                        selectedKey={McsUtil.isString(data.IncreaseDecreaseExpenditures) ? data.IncreaseDecreaseExpenditures : "No"}
                        onChange={this._expenditureChangeSelected}
                        options={this._getChangeOptions()}
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column12NoPadding}>
                      <ChoiceGroup label="Increase or decrease expenditures NOT related to program operation or implementation?"
                        className={styles.inlineflex + " " + styles.inlineflexInline}
                        selectedKey={McsUtil.isString(data.IncDecUnrelExpenditures) ? data.IncDecUnrelExpenditures : "No"}
                        onChange={this._unrelExpenditureSelected}
                        options={this._getChangeOptions()}
                      />
                    </div></div>
                  <div className={styles.row}>
                    <div className={styles.column12NoPadding}>
                      <ChoiceGroup label="Affect caseloads for the courts?"
                        className={styles.inlineflex + " " + styles.inlineflexInline}
                        selectedKey={data.AffectCaseloadsfortheCourts ? "Yes" : "No"}
                        onChange={this._affectCaseloadsSelected}
                        options={this._getChangeOptions()}
                      />
                    </div>
                  </div>
                </fieldset>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>Agency to send bill to</legend>
                  <div className={styles.row}>
                    <fieldset className={styles.fieldset}>
                      {!this._controlPermissions.CanAddAgencies && <Label>Note: The selected agencies won't be added unless the 'Send for Fiscal Note' option is selected.</Label>}
                      {
                        data.FiscalDirectiveAgencies && data.FiscalDirectiveAgencies.length > 0 &&
                        data.FiscalDirectiveAgencies.map((agency, index) => {
                          return <AgencyControl
                            disabled={!this._controlPermissions.CanAddAgencies}
                            agencyControl={agency}
                            index={index}
                            onChanged={this._agencyChanged}
                            removeAgency={this._removeAgency}
                            options={this._uniqueAgencyDdlList} />;
                        })
                      }
                    </fieldset>
                  </div>
                  <div className={styles.column6}>
                    <ActionButton disabled={!this._controlPermissions.CanAddAgencies} data-automation-id="insertAgency" iconProps={{ iconName: "Add" }}
                      onClick={this._insertAgency}>Insert Agency</ActionButton>
                    <TextField label="Number of agencies selected" value={data.AgencyCount.toString()}
                      readOnly={true} />
                  </div>
                </fieldset>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}> Additional Information</legend>
                  <div className={styles.row}>
                    <div className={styles.column12}>
                      <Checkbox onChange={this._onSeeDrafterChecked} checked={data.SeeDrafter}
                        label="Fiscal Analyst needs to see drafter (if fiscal impact is uncertain)" />
                    </div>
                    <div className={styles.column12}>
                      <TextField label="Additional direction to fiscal staff" multiline rows={5} value={data.AdditionalInformation} onChanged={this._additionalInfoChanged} />
                    </div>
                  </div>
                </fieldset>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>Prepared By </legend>
                  <div className={styles.row}>
                    <div className={styles.column6}>
                      <TextField className={styles.fieldpadding} label="First Name" required={true} errorMessage={this._getValidationForField("PreparedByFirstName")}
                        value={data.PreparedByFirstName} onChanged={this._preparedByFirstNameChanged} />
                    </div>
                    <div className={styles.column6}>
                      <TextField className={styles.fieldpadding} label="Last Name" required={true} errorMessage={this._getValidationForField("PreparedByLastName")}
                        value={data.PreparedByLastName} onChanged={this._preparedByLastNameChanged} />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column6}>
                      <TextField className={styles.fieldpadding} label="Title" value={data.PreparedByTitle} onChanged={this._preparedByTitleChanged} />
                    </div>
                    <div className={styles.column6}>
                      <TextField className={styles.fieldpadding} label="Email" value={data.PreparedByEmail} onChanged={this._preparedByEmailChanged} />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.column6}>
                      <TextField className={styles.fieldpadding} label="Phone" value={data.PreparedByPhone} onChanged={this._preparedByPhoneChanged} />
                    </div>
                    <div className={styles.column6}>
                      <TextField className={styles.fieldpadding} label="Fax" value={data.PreparedByFax} onChanged={this._preparedByFaxChanged} />
                    </div>
                  </div>
                </fieldset>
                <div className={styles.row}>
                  <div className={styles.column12}>
                    <DefaultButton className={styles.button} text="Submit" onClick={this._saveFiscalDirective} />
                    <DefaultButton className={styles.button} text="Cancel" onClick={this._cancel} />
                  </div>
                </div>
                <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
              </div>
            </div>}
        </div>
      </div>
    );
  }

  public componentDidUpdate(prevProps: IFiscalNoteDirectiveProps, prevState: IFiscalNoteDirectiveState, prevContext: any): void {
    if (prevState.signedIn !== this.state.signedIn) {
      tokenProvider.getToken().then((token) => {
        this._getData();
        // this.setState({ ...this.state, hasToken: true });
      }, (err) => {
        this.setState({ ...this.state, loading: false, error: "Unable to get access token" });
      });
    }
  }

  private _getChangeOptions(): IChoiceGroupOption[] {
    return [
      {
        key: "Yes",
        text: "Yes",
      } as IChoiceGroupOption,
      {
        key: "No",
        text: "No",
      },
    ];
  }

  @autobind
  private _preparedByFirstNameChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreparedByFirstName = value;
    this._setState(data);
  }

  @autobind
  private _preparedByLastNameChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreparedByLastName = value;
    this._setState(data);
  }

  @autobind
  private _preparedByEmailChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreparedByEmail = value;
    this._setState(data);
  }

  @autobind
  private _preparedByFaxChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreparedByFax = value;
    this._setState(data);
  }

  @autobind
  private _preparedByPhoneChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreparedByPhone = value;
    this._setState(data);
  }

  @autobind
  private _preparedByTitleChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreparedByTitle = value;
    this._setState(data);
  }

  @autobind
  private _insertAgency(): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    if (!McsUtil.isArray(data.FiscalDirectiveAgencies)) {
      data.FiscalDirectiveAgencies = [];
    }
    data.FiscalDirectiveAgencies.push({
      Id: 0,
      FiscalDirectiveId: this._handleNumber(data.Id),
      AgencyCode: "",
      AgencyName: "",
    } as IFiscalDirectiveAgency);
    data.AgencyCount++;
    this._setState(data);
  }

  @autobind
  private _expenditureChangeSelected(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.IncreaseDecreaseExpenditures = option.key;
    this._setState(data);
  }

  @autobind
  private _unrelExpenditureSelected(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.IncDecUnrelExpenditures = option.key;
    this._setState(data);
  }

  @autobind
  private _affectCaseloadsSelected(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.AffectCaseloadsfortheCourts = option.key === "Yes";
    this._setState(data);
  }

  @autobind
  private _revenueChangeSelected(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.IncreaseDecreaseRevenue = option.key;
    this._setState(data);
  }

  @autobind
  private _containAppropriationSelected(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.ContainAppropriation = option.key === "Yes";
    this._setState(data);
  }

  @autobind
  private _authorizeAdditionalPersonalSelected(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.AuthorizeAdditionalPeronnel = option.key;
    this._setState(data);
  }

  @autobind
  private _onSeeDrafterChecked(ev: React.FormEvent<HTMLElement>, isChecked: boolean): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.SeeDrafter = isChecked;
    this._setState(data);
  }

  @autobind
  private _additionalInfoChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.AdditionalInformation = value;
    this._setState(data);
  }

  @autobind
  private _onIdenticalLsoChanged(option: IDropdownOption, index?: number): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.IdenticalLSO = option.key.toString();
    this._setState(data);
  }

  @autobind
  private _onSimilarLsoChanged(option: IDropdownOption, index?: number): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.SimilarLSO = option.key.toString();
    this._setState(data);
  }

  @autobind
  private _documentDispositionChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.DocumentDisposition = option.key;
    this._handleControlPermissions(data);
    this._setState(data);
  }

  @autobind
  private _onOtherCommentsChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.OtherCommentsFiscalNote = value;
    this._setState(data);
  }

  @autobind
  private _sendDispositionChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.SendDisposition = option.key;
    this._controlPermissions.CanAddOtherComments = data.SendDisposition === "Other";
    data.OtherCommentsFiscalNote = "";
    this._setState(data);
  }

  @autobind
  private _onBillDraftChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.BillDrafted = option.key;
    data.IdenticalLSO = "";
    data.SimilarLSO = "";
    data.PreviousLSO = "";
    data.PreviousYear = "";
    this._handleControlPermissions(data);
    this._setState(data);
  }

  /**
   * @summary A function to handle the permission of controls eg: canInputIdenticalLso should be disabled if radio 'From identical...' is not selected
   * @private
   * @param {IFiscalDirectiveForm} data : temp data before setting state
   * @memberof FiscalNoteDirective
   */
  private _handleControlPermissions(data: IFiscalDirectiveForm): void {
    const permissions: IFormControlPermission = {
      CanAddAgencies: true,
      CanAddOtherComments: false,
      CanInputIdenticalLso: false,
      CanInputSimilarLso: false,
      CanInputPreviousLso: false,
    };
    switch (data.BillDrafted) {
      case "From identical bill drafted this session": permissions.CanInputIdenticalLso = true; break;
      case "From similar bill drafted this session": permissions.CanInputSimilarLso = true; break;
      case "From similar bill": permissions.CanInputPreviousLso = true; break;
      default: break;
    }
    permissions.CanAddAgencies = data.DocumentDisposition === "Send For Fiscal Note";
    permissions.CanAddOtherComments = data.SendDisposition === "Other";
    this._controlPermissions = permissions;
  }

  @autobind
  private _onPreviousLsoChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreviousLSO = value;
    this._setState(data);
  }

  @autobind
  private _onPreviousYearChanged(value: string): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.PreviousYear = value;
    this._setState(data);
  }

  @autobind
  private _agencyChanged(value: IFiscalDirectiveAgency, index: number): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.FiscalDirectiveAgencies[index] = value;
    this._setState(data);
  }

  @autobind
  private _removeAgency(index: number): void {
    const data: IFiscalDirectiveForm = clone(this.state.data);
    data.FiscalDirectiveAgencies.splice(index, 1);
    data.AgencyCount--;
    this._setState(data);
  }

  @autobind
  private _saveFiscalDirective(): void {
    const tempDirective: IFiscalDirectiveForm = clone(this.state.data);
    if (!this._controlPermissions.CanAddAgencies) {
      tempDirective.AgencyCount = 0;
      tempDirective.FiscalDirectiveAgencies = [];
    }
    const tempValidation: IFormValidation = this._validateForm(tempDirective);
    if (tempValidation.IsValid) {
      tokenProvider.getToken().then((token) => {
        if (McsUtil.isDefined(this.props.httpClient)) {
          this._spinner.setVisibility(true);
          if (tempDirective.Id > 0) {
            this._service.updateItem(this.props.httpClient, this._bill, tempDirective, token).then(() => {
              this._spinner.setVisibility(false);
              this._redirect();
            }, () => this._spinner.setVisibility(false));
          } else {
            this._service.addNewItem(this.props.httpClient, this._bill, tempDirective, token).then(() => {
              this._spinner.setVisibility(false);
              this._redirect();
            }, () => this._spinner.setVisibility(false));
          }
        } else {
          this.setState({ ...this.state, error: "Network error" });
        }
      });
    }
  }

  @autobind
  private _cancel(): void {
    this._redirect();
  }

  private _redirect(): void {
    const queryParameters: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
    if (queryParameters.getValue("source")) {
      window.location.href = decodeURIComponent(queryParameters.getValue("source"));
    } else {
      window.location.href = McsUtil.combinePaths(config.getLmsUrl(), Constants.Pages.DraftingDesktop);
    }
  }

  private _getLsoOptions(): IDropdownOption[] {
    const dropdownOptions: IDropdownOption[] = [{ key: "", text: "Select a Lso Number" }].concat(this._allBill.map((b) => {
      return {
        key: b.LSONumber,
        text: b.LSONumber,
      };
    }));
    return dropdownOptions;
  }

  private _getBillDraftOptions(): IChoiceGroupOption[] {
    return [
      {
        key: "From Scratch",
        text: "From Scratch",
      } as IChoiceGroupOption,
      {
        key: "From identical bill drafted this session",
        text: "From identical bill drafted this session",
      },
      {
        key: "From similar bill drafted this session",
        text: "From similar bill drafted this session",
      },
      {
        key: "From similar bill",
        text: "From similar bill",
      },
    ];
  }

  @autobind
  private _getDocumentDispositionOptions(): IChoiceGroupOption[] {
    return [
      {
        key: "Do Not Send",
        text: "Do not send for Fiscal Note",
      } as IChoiceGroupOption,
      {
        key: "Send For Fiscal Note",
        text: "Send for Fiscal Note",
      },
    ];
  }

  @autobind
  private _getDispositionOptions(): IChoiceGroupOption[] {
    return [
      {
        key: "This is the first version of the bill to be sent for fiscal note",
        text: "This is the first version of the bill to be sent for fiscal note",
      } as IChoiceGroupOption,
      {
        key: "A prior version was submited for fiscal note and this version WILL/MAY change fiscal impact",
        text: "A prior version was submited for fiscal note and this version WILL/MAY change fiscal impact",
      },
      {
        key: "A prior version was submited for fiscal note and this version DOES NOT change fiscal impact",
        text: "A prior version was submited for fiscal note and this version DOES NOT change fiscal impact",
      },
      {
        key: "Other",
        text: "Other (Explain)",
      },
    ];
  }

  private _getData(): void {
    let lsoNumber: string = "";
    const queryParameters: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
    if (queryParameters.getValue("LSONumber")) {
      lsoNumber = queryParameters.getValue("LSONumber");
    }
    if (McsUtil.isString(lsoNumber)) {
      tokenProvider.getToken().then((token: string) => {
        this._billApi.getBill(lsoNumber).then((bill: IBills) => {
          this._bill = bill;
          const peopleService: PeopleService = new PeopleService();
          const defaultValue: IFiscalDirectiveForm = this._getDefaultValue(lsoNumber, bill);
          Promise.all([this._service.getItemByLsoNumber(this.props.httpClient, lsoNumber, token),
          this._billApi.getListItems("", ["LSONumber"], [], "LSONumber", true),
          peopleService.loadCurrentUserProfile(),
          this._service.getFiscalAgencyContact(),
          ]).then((responses) => {
            const userProfileProperties: any = responses[2];
            defaultValue.PreparedByFirstName = this._getUserPropertyValue(userProfileProperties, "FirstName");
            defaultValue.PreparedByLastName = this._getUserPropertyValue(userProfileProperties, "LastName");
            defaultValue.PreparedByEmail = this._getUserPropertyValue(userProfileProperties, "WorkEmail");
            defaultValue.PreparedByPhone = this._getUserPropertyValue(userProfileProperties, "WorkPhone");
            defaultValue.PreparedByFax = this._getUserPropertyValue(userProfileProperties, "Fax");
            defaultValue.PreparedByTitle = this._getUserPropertyValue(userProfileProperties, "Title");

            const fiscalDirective: IFiscalDirectiveForm = McsUtil.isDefined(responses[0]) ? responses[0] : defaultValue;
            this._allBill = responses[1];
            fiscalDirective.ModifiedBy = this._getUserPropertyValue(userProfileProperties, "UserName");
            fiscalDirective.ModifiedDate = new Date();

            this._uniqueAgencyDdlList = this._getAgencyCodes(this._service.getUniqueAgency(responses[3]));

            this._handleControlPermissions(fiscalDirective);
            this.setState({
              ...this.state,
              data: fiscalDirective,
              loading: false,
            });
          }, (err) => {
            this._setErrorState(err);
          });
        }, (error) => { this._setErrorState(error); });
      });
    } else {
      this._setErrorState("LsoNumber is required.");
    }
  }

  private _getAgencyCodes(agencyList: IAgencyContact[]): IDropdownOption[] {
    return [
      { key: "", text: "Select a code" },
    ].concat(agencyList.map((v) => {
      return { key: v.Title, text: v.AgencyName };
    }));
  }

  private _getUserPropertyValue(userProfile: any, key: string): string {
    const tempValue: string = userProfile[key];
    if (McsUtil.isDefined(tempValue)) {
      return tempValue;
    }
    // tslint:disable-next-line:prefer-for-of
    for (let i: number = 0; i < userProfile.UserProfileProperties.length; i++) {
      const property: any = userProfile.UserProfileProperties[i];
      if (property.Key === key) {
        return property.Value;
      }
    }
    return "";
  }

  private _getDefaultValue(lsoNumber: string, bill?: IBills): IFiscalDirectiveForm {
    return {
      BillId: 0,
      DocumentDisposition: "Do Not Send",
      BillDrafted: "From Scratch",
      ContainAppropriation: false,
      ContainAppropriationSpecified: false,
      AuthorizeAdditionalPeronnel: "No",
      ChangeRevenueStreams: "No",
      IncreaseDecreaseRevenue: "No",
      IncreaseDecreaseExpenditures: "No",
      IncDecUnrelExpenditures: "No",
      AffectCaseloadsfortheCourts: false,
      Date: new Date(),
      LSONumber: McsUtil.isDefined(bill) ? bill.LSONumber : "",
      CatchTitle: McsUtil.isDefined(bill) ? bill.CatchTitle : "",
      BillDocumentVersion: McsUtil.isDefined(bill) ? `${bill.DocumentVersion}` : "", // billversion in string format is required by api
      PreparedByFirstName: "",
      PreparedByLastName: "",
      PreparedByTitle: "",
      PreparedByPhone: "",
      PreparedByEmail: "",
      IdenticalLSO: "",
      SimilarLSO: "",
      PreviousLSO: "",
      PreviousYear: "",
      SeeDrafter: false,
      Sponsor: McsUtil.isDefined(bill) ? bill.Sponsor : "",
      Drafter: McsUtil.isDefined(bill) && McsUtil.isDefined(bill.Drafter) ? bill.Drafter.Title : "",
      BillNumber: McsUtil.isDefined(bill) ? bill.BillNumber : "",
      AgencyCount: 0,
      PreparedByFax: "",
      AdditionalInformation: "",
      SendDisposition: "This is the first version of the bill to be sent for fiscal note",
      OtherCommentsFiscalNote: "",
      ModifiedBy: "",
      ModifiedDate: new Date(),
      FiscalDirectiveAgencies: [],
    } as IFiscalDirectiveForm;
  }

  private _setErrorState(error?: string): void {
    if (!McsUtil.isString(error)) {
      if (McsUtil.isDefined(this._bill)) {
        error = error;
      } else {
        error = "Invalid lsonumber";
      }
    }
    this.setState({ ...this.state, error, loading: false });
  }

  private _handleLabel(value: any): string {
    if (McsUtil.isDefined(value)) {
      return value as string;
    }
    return "-";
  }

  private _handleDate(value: Date): string {
    return McsUtil.isDefined(value) ? new Date(value.toString()).format("MM/dd/yyyy") : "";
  }

  private _handleNumber(value: any): number {
    return McsUtil.isNumberString(value as string) ? parseInt(value as string, 10) : 0;
  }

  private _setState(data: IFiscalDirectiveForm): void {
    this.setState({ ...this.state, data, formValidation: this._validateForm(data) });
  }
  // validation part
  private _validateForm(data: IFiscalDirectiveForm): IFormValidation {
    const formValidation: IFormValidation = {
      IsValid: true,
      FieldValidations: [
        this._validateField("PreparedByFirstName", McsUtil.isString(data.PreparedByFirstName)),
        this._validateField("PreparedByLastName", McsUtil.isString(data.PreparedByLastName)),
        this._validateField("OtherCommentsFiscalNote", !this._controlPermissions.CanAddOtherComments || McsUtil.isString(data.OtherCommentsFiscalNote)),
        this._validateField("IdenticalLSO", !this._controlPermissions.CanInputIdenticalLso || McsUtil.isString(data.IdenticalLSO)),
        this._validateField("SimilarLSO", !this._controlPermissions.CanInputSimilarLso || McsUtil.isString(data.SimilarLSO)),
        this._validateField("PreviousLSO", !this._controlPermissions.CanInputPreviousLso || McsUtil.isString(data.PreviousLSO)),
        this._validateField("PreviousYear", !this._controlPermissions.CanInputPreviousLso || McsUtil.isString(data.PreviousYear)),
      ],
    };
    formValidation.IsValid = formValidation.FieldValidations.filter((x) => !x.IsValid).length <= 0;
    return formValidation;
  }

  private _validateField(fieldName: string, valid: boolean, message?: string): IFieldValidation {
    return {
      FieldName: fieldName,
      IsValid: valid,
      ErrorMessage: (valid) ? "" : (McsUtil.isString(message)) ? message : "Field cannot be empty.",
    };
  }

  private _getValidationForField(fieldName: string): string {
    const formValidation: IFormValidation = clone(this.state.formValidation);
    if (McsUtil.isArray(formValidation.FieldValidations)) {
      const validations: IFieldValidation[] = formValidation.FieldValidations.filter((f) => f.FieldName === fieldName);
      if (validations.length > 0) {
        return validations[0].ErrorMessage;
      }
    }
    return "";
  }
}
