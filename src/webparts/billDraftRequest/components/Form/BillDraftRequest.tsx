import * as React from "react";
import styles from "./BillDraftRequest.module.scss";
import { IBillDraftRequestProps } from "./IBillDraftRequestProps";
import { escape, clone } from "@microsoft/sp-lodash-subset";
import "../../../../aad/WebPartAuthenticationContext";
import { IBillDraftRequestState } from "./IBillDraftRequestState";
import {
  autobind,
  TextField,
  DefaultButton,
  Label,
  ChoiceGroup,
  IChoiceGroupOption,
  Dropdown,
  IDropdownOption,
  DatePicker,
  IBasePickerSuggestionsProps,
  IPersonaProps,
  IDatePickerStrings,
} from "office-ui-fabric-react";
import { Loading, Error } from "../../../../controls/Loading/Loading";
import { McsUtil, ICommittee, Constants, IBillDraftRequest, ILegislator, IBills, tokenProvider } from "mcs-lms-core";
import WebpartHeader from "../../../../controls/WebpartHeader/WebpartHeader";
import InfoReceivedSection from "../InfoReceivedSection/InfoReceivedSection";
import LmsPeoplePicker from "../../../../controls/PeoplePicker/LmsPeoplePicker";
import SponsorSelector from "../../../../controls/SponsorSelector/SponsorSelector";
import BillDisclosureSection from "../BillDisclosureSection/BillDisclosureSection";
import { SiteUserProps } from "sp-pnp-js";
import { InfoReceivedChoices } from "./InfoReceivedChoices";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import { BillDraftService } from "../../../../services/BillDraftService";
import { PeopleService } from "../../../../services/PeopleService";
import SpinnerControl from "../../../../controls/Loading/SpinnerControl";
import { SponsorService } from "../../../../services/SponsorService";

const suggestionProps: IBasePickerSuggestionsProps = {
  suggestionsHeaderText: "Suggested People",
  mostRecentlyUsedHeaderText: "Suggested Contacts",
  noResultsFoundText: "No results found",
  loadingText: "Loading",
  showRemoveButtons: true,
  suggestionsAvailableAlertText: "People Picker Suggestions available",
};
const dateFormat: string = "MM/dd/YYYY";

interface IUserInfo {
  DrafterToPersona?: IPersonaProps;
  ReceiverToPersona?: IPersonaProps;
}

export default class BillDraftRequest extends React.Component<IBillDraftRequestProps, IBillDraftRequestState> {
  private _billDraftService: BillDraftService;
  private _userInfo: IUserInfo;
  private _spinner: SpinnerControl;
  private _isEditForm: boolean;

  constructor(props: IBillDraftRequestProps, context?: any) {
    super(props);
    this._userInfo = {};
    this._billDraftService = new BillDraftService(this.props.isLocalEnvironment);
    const queryParameters: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
    let id: number;
    if (queryParameters.getValue("bdrid")) {
      id = parseInt(queryParameters.getValue("bdrid"), 10);
    }
    const bdr: IBillDraftRequest = BillDraftService.getDefaultValue(id);
    if (queryParameters.getValue("lsonumber")) {
      const lsonumber: string = queryParameters.getValue("lsonumber");
      bdr.LSONumber = lsonumber;
    }
    this._isEditForm = id > 0 || McsUtil.isString(bdr.LSONumber);
    this.state = {
      loading: id > 0 || McsUtil.isString(bdr.LSONumber),
      billDraftRequest: bdr,
      error: undefined,
      signedIn: false,
      canChangeBillType: false,
      formValidation: this._validateForm(),
    };
  }

  public componentDidMount(): void {
    tokenProvider.isSignedIn().then((isSignedIn) => {
      this.setState({ ...this.state, error: "", signedIn: isSignedIn });
    }, (err) => {
      this.setState({ ...this.state, error: err, signedIn: false });
    });
  }

  public render(): React.ReactElement<IBillDraftRequestProps> {
    const { isLocalEnvironment, spHttpClient, isInEditMode } = this.props;
    if (isInEditMode) {
      this._spinner.setVisibility(true);
    }
    const committeeSponsorFilter: any = (value: ICommittee, index?: number, array?: ICommittee[]): boolean => {
      return value.CanSponsor;
    };
    const committeeCoSponsorFilter: any = (value: ICommittee, index?: number, array?: ICommittee[]): boolean => {
      return value.CanCoSponsor;
    };
    return (
      <div className={styles.billDraftRequest} >
        <div className={styles.container}>
          <WebpartHeader webpartTitle="Bill Draft Request Form" />
          <div className={styles.content}>
            {this.state.loading && (<Loading />)}
            {!this.state.loading && (this.state.error !== "") && (<Error message={this.state.error} />)}
            {((!this.state.loading && (this.state.error === "")) || !this._isEditForm) && <div>
              {this.state.billDraftRequest.Id > 0 && (<div className={styles.row}>
                <div className={styles.column12}>
                  <Label className={styles.lsolabel}>Lso Number:</Label>
                  <Label className={styles.lsolabel}>{this.state.billDraftRequest.LSONumber}</Label>
                </div>
              </div>)}
              <div className={styles.row}>
                <div className={styles.column12}>
                  <InfoReceivedSection selectedValue={this.state.billDraftRequest.InfoReceivedMethod}
                    label="Information Received Method"
                    options={InfoReceivedChoices}
                    onChanged={this._onInfoReceivedMethodChanged}
                    isrequired={true}
                    errorMessage="Information Received Method is required." />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column6}>
                  <LmsPeoplePicker
                    selectedUser={this._getReceiver()}
                    label="Received By"
                    spHttpClient={spHttpClient}
                    principalTypeUser={true}
                    principalTypeSharePointGroup={false}
                    principalTypeDistributionList={false}
                    principalTypeSecurityGroup={false}
                    isLocalEnvironment={isLocalEnvironment}
                    onchange={this._receiverSelected}
                  />
                  {!this.state.formValidation.draftReceivedBy.isValid && <div className={styles.errorMessage}>
                    {this.state.formValidation.draftReceivedBy.errorMessage}
                  </div>}
                </div>
                <div className={styles.column6}>
                  <DatePicker
                    className={styles.fieldPadding}
                    value={new Date(this.state.billDraftRequest.DateReceived.toString())}
                    label="Date Received"
                    isRequired={true}
                    allowTextInput={false}
                    formatDate={this._formatDate}
                    isMonthPickerVisible={false}
                    onSelectDate={this._onDateReceivedSelected}
                    placeholder="Select date received..." />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column12}>
                  <TextField label="Catch Title"
                    className={styles.fieldPadding}
                    value={this.state.billDraftRequest.CatchTitle}
                    onChanged={this._onCatchTitleChanged}
                    required={true}
                    errorMessage={this.state.formValidation.catchTitle.errorMessage}
                    placeholder="Enter catch title" />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column6}>
                  <SponsorSelector
                    isLocalEnvironment={this.props.isLocalEnvironment}
                    allowOther={true}
                    label="Requestor"
                    isRequired={true}
                    multiselect={false}
                    selectedType={Constants.SponsorType[this.state.billDraftRequest.RequestorType]}
                    selectedValue={this.state.billDraftRequest.Requestor}
                    errorMessage={this.state.formValidation.requestor.errorMessage}
                    onchange={this._onRequestorChanged} />
                </div>
                <div className={styles.column6}>
                  <SponsorSelector
                    isLocalEnvironment={this.props.isLocalEnvironment}
                    allowOther={false}
                    label="Sponsor"
                    isRequired={true}
                    multiselect={false}
                    errorMessage={this.state.formValidation.sponsor.errorMessage}
                    selectedType={Constants.SponsorType[this.state.billDraftRequest.SponsorType]}
                    selectedValue={this.state.billDraftRequest.Sponsor}
                    committeeFilter={committeeSponsorFilter}
                    onchange={this._onSponsorChanged} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column6}>
                  <SponsorSelector
                    isLocalEnvironment={this.props.isLocalEnvironment}
                    allowOther={false}
                    multiselect={true}
                    disabled={this.state.billDraftRequest.SponsorType === "Committee"}
                    label="Co-sponsor(s)"
                    isRequired={false}
                    selectedValue={this.state.billDraftRequest.CoSponsor}
                    selectedType={Constants.SponsorType[this.state.billDraftRequest.CoSponsorType]}
                    committeeFilter={committeeCoSponsorFilter}
                    onchange={this._onCoSponsorChanged} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column4}>
                  <LmsPeoplePicker
                    label="Drafter"
                    selectedUser={this._getDrafters()}
                    spHttpClient={spHttpClient}
                    principalTypeUser={true}
                    principalTypeSharePointGroup={false}
                    principalTypeDistributionList={false}
                    principalTypeSecurityGroup={false}
                    isLocalEnvironment={isLocalEnvironment}
                    onchange={this._drafterSelected}
                  />
                </div>
                <div className={styles.column4}>
                  <Dropdown
                    className={styles.fieldPadding}
                    label="Legislation Type"
                    placeHolder="Select legislation type"
                    selectedKey={this.state.billDraftRequest.LegislationType}
                    onChanged={this._onLegislationTypeChanged}
                    disabled={!this.state.canChangeBillType}
                    required={true}
                    options={[
                      { key: "Bill", text: "Bill" },
                      { key: "Constitutional Resolution", text: "Constitutional Resolution" },
                      { key: "Congressional Resolution", text: "Congressional Resolution" },
                      { key: "Other Resolution", text: "Other Resolution" },
                      { key: "Informal Resolution", text: "Informal Resolution" },
                    ]} />
                </div>
                <div className={styles.column4}>
                  <ChoiceGroup
                    className={styles.inlineflex}
                    readOnly={true}
                    selectedKey={this.state.billDraftRequest.HouseofOrigin}
                    onChange={this._onHouseOfOriginChanged}
                    label="House of Origin"
                    options={[
                      {
                        key: "House",
                        text: "House",
                      } as IChoiceGroupOption,
                      {
                        key: "Senate",
                        text: "Senate",
                      },
                    ]}
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column12}>
                  <TextField
                    className={styles.fieldPadding}
                    label="Drafting instructions"
                    value={this.state.billDraftRequest.DraftingInstructions}
                    onChanged={this._onDraftingInstructionChanged}
                    resizable={false}
                    multiline />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column12}>
                  <TextField
                    className={styles.fieldPadding}
                    label="Contact person for more information"
                    value={this.state.billDraftRequest.ContactPerson}
                    onChanged={this._onContactPersonChanged}
                    resizable={false} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column12}>
                  <BillDisclosureSection
                    billDisclosed={this.state.billDraftRequest.BillDisclosed}
                    onChanged={this._onBillDisclosedChanged} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column4}>
                  <ChoiceGroup
                    className={styles.inlineflex}
                    selectedKey={this.state.billDraftRequest.HasFiscalImpact}
                    onChange={this._onHasFiscalImpactChanged}
                    label="Does the bill have fiscal impact?"
                    options={[
                      {
                        key: "Yes",
                        text: "Yes",
                      } as IChoiceGroupOption,
                      {
                        key: "No",
                        text: "No",
                      },
                      {
                        key: "Unknown",
                        text: "Unknown",
                      },
                    ]}
                  />
                </div>
                <div className={styles.column4}>
                  <ChoiceGroup
                    className={styles.inlineflex}
                    label="Is it a revenue raising bill?"
                    selectedKey={this.state.billDraftRequest.RevenueRaising ? "Yes" : "No"}
                    onChange={this._onRevenueRaisingChanged}
                    options={[
                      {
                        key: "Yes",
                        text: "Yes",
                      } as IChoiceGroupOption,
                      {
                        key: "No",
                        text: "No",
                      },
                    ]}
                  />
                </div>
                <div className={styles.column4}>
                  <DatePicker
                    className={styles.fieldPadding}
                    value={this._getDate(this.state.billDraftRequest.RevenueRaisingDate)}
                    label="If yes & Senate, Memo Sent on:"
                    isRequired={this.state.billDraftRequest.HouseofOrigin === "Senate" && this.state.billDraftRequest.RevenueRaising}
                    allowTextInput={false}
                    disabled={this.state.billDraftRequest.HouseofOrigin !== "Senate" || !this.state.billDraftRequest.RevenueRaising}
                    isMonthPickerVisible={false}
                    onSelectDate={this._onMemoSentSelected}
                    placeholder="Select date received..."
                    strings={this._getMemoError()} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column6}>
                  <ChoiceGroup
                    className={styles.inlineflex}
                    selectedKey={this.state.billDraftRequest.ReleaseBill}
                    onChange={this._onBillReleaseChanged}
                    label="Release bill to sponsor?"
                    options={[
                      {
                        key: "Sponsor",
                        text: "Yes",
                      } as IChoiceGroupOption,
                      {
                        key: "None",
                        text: "No",
                      },
                    ]}
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.column12}>
                  <DefaultButton className={styles.button} onClick={this._onSubmit} text="Submit" />
                  {/* <DefaultButton className={styles.button} text="Spell Check" /> */}
                </div>
              </div>
            </div>
            }
            <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
          </div>
        </div>
      </div >
    );
  }

  public componentDidUpdate(prevProps: IBillDraftRequestProps, prevState: IBillDraftRequestState, prevContext: any): void {
    if (!this.props.isInEditMode) {
      if (prevState.signedIn !== this.state.signedIn && !McsUtil.isDefined(this.state.hasToken)) {
        tokenProvider.getToken().then((token) => {
          this._getData();
          this.setState({ ...this.state, hasToken: true });
        }, (err) => {
          this.setState({ ...this.state, hasToken: false });
        });
      }
    }
  }

  private _getMemoError(): IDatePickerStrings {
    const strings: IDatePickerStrings = {
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      shortDays: ["S", "M", "T", "W", "T", "F", "S"],
      goToToday: "Go to today",
      prevMonthAriaLabel: "Go to previous month",
      nextMonthAriaLabel: "Go to next month",
      prevYearAriaLabel: "Go to previous year",
      nextYearAriaLabel: "Go to next year",
      isRequiredErrorMessage: this.state.formValidation.memoDate.errorMessage,
      invalidInputErrorMessage: "Invalid date format.",
    };
    return strings;
  }

  private _getDrafters(): IPersonaProps[] {
    if (this._userInfo.DrafterToPersona) {
      return [this._userInfo.DrafterToPersona];
    }
    return [];
  }

  private _getReceiver(): IPersonaProps[] {
    if (this._userInfo.ReceiverToPersona) {
      return [this._userInfo.ReceiverToPersona];
    }
    return [];
  }

  private _getLegislatorDisplayNameWithPrefix(chamber: string, displayName: string): string {
    return `${(chamber === "House") ? "Representative" : "Senator"} ${displayName}`;
  }

  @autobind
  private _receiverSelected(users: SiteUserProps[], items: IPersonaProps[]): void {
    let newUser: any = null;
    let newPersona: IPersonaProps = null;
    if (users.length > 0) {
      newUser = { Id: users[0].Id, EMail: users[0].Email, Title: users[0].Title };
      newPersona = items[0];
    }
    this._userInfo.ReceiverToPersona = newPersona;
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    if (McsUtil.isArray(users) && users.length > 0) {
      bdr.DraftReceivedBy = users[0].Title;
    } else {
      bdr.DraftReceivedBy = "";
    }
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
      formValidation: this._validateForm(bdr),
    });
  }

  @autobind
  private _drafterSelected(users: SiteUserProps[], items: IPersonaProps[]): void {
    let newUser: any = null;
    let newPersona: IPersonaProps = null;
    if (users.length > 0) {
      newUser = { Id: users[0].Id, EMail: users[0].Email, Title: users[0].Title };
      newPersona = items[0];
    }
    this._userInfo.DrafterToPersona = newPersona;
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    if (McsUtil.isArray(users) && users.length > 0) {
      bdr.DrafterId = users[0].Id;
    } else {
      bdr.DrafterId = null;
    }
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  private _getSponsorSelectorValue(type: Constants.SponsorType, selected: any): string {
    if ((!McsUtil.isDefined(selected)) || selected === null) {
      return null;
    } else {
      switch (type) {
        case Constants.SponsorType.Legislator:
          const legislator: ILegislator = McsUtil.isArray(selected) ? selected[0] : selected;
          return this._getLegislatorDisplayNameWithPrefix(legislator.Chamber, legislator.LegislatureDisplayName);
        case Constants.SponsorType.Committee:
          const committee: ICommittee = McsUtil.isArray(selected) ? selected[0] : selected;
          return committee.CommitteeDisplayTitle;
        default: return selected.toString();
      }
    }
  }

  @autobind
  private _onRequestorChanged(type: Constants.SponsorType, selected: string): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.RequestorType = Constants.SponsorType[type];
    if ((!McsUtil.isDefined(selected)) || selected === null) {
      bdr.Requestor = null;
    } else {
      bdr.Requestor = selected;
    }
    const validation: any = this._validateForm(bdr);
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
      formValidation: validation,
    });
  }

  @autobind
  private _onSponsorChanged(type: Constants.SponsorType, selected: string, selectedObjects: any[]): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.SponsorType = Constants.SponsorType[type];
    if ((!McsUtil.isDefined(selected)) || selected === null) {
      bdr.Sponsor = null;
      bdr.SponsorTitle = null;
      bdr.PrimeSponsorshipClause = null;
    } else {
      bdr.Sponsor = selected;
      if (type === Constants.SponsorType.Legislator) {
        if (McsUtil.isArray(selectedObjects)) {
          bdr.PrimeSponsorshipClause = selectedObjects[0].Title + "(s) " + selectedObjects[0].LegislatureDisplayName;
          bdr.SponsorTitle = McsUtil.isArray(selectedObjects) ? selectedObjects[0].Title : "";
          if (/House/i.test(selectedObjects[0].Chamber)) {
            bdr.HouseofOrigin = "House";
          } else {
            bdr.HouseofOrigin = "Senate";
          }
        }
      } else {
        bdr.SponsorTitle = "";
        bdr.SponsorshipClause = bdr.Sponsor;
        bdr.PrimeSponsorshipClause = bdr.Sponsor;
      }
    }
    const validation: any = this._validateForm(bdr);
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
      formValidation: validation,
    });
  }

  @autobind
  private _onCoSponsorChanged(type: Constants.SponsorType, selected: any): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.CoSponsor = selected;
    bdr.CoSponsorType = Constants.SponsorType[type];
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  private _getDate(val: string | Date): Date {
    if (McsUtil.isString(val)) {
      try {
        return new Date(val.toString());
      } catch (e) {
        return undefined;
      }
    }
    return val as Date;
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
  private _onLegislationTypeChanged(option: IDropdownOption, index?: number): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.LegislationType = option.key.toString();
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onCatchTitleChanged(value: string): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.CatchTitle = value;
    const validation: any = this._validateForm(bdr);
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
      formValidation: validation,
    });
  }

  @autobind
  private _onDraftingInstructionChanged(value: any): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.DraftingInstructions = value;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onHouseOfOriginChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.HouseofOrigin = option.key;
    bdr.RevenueRaisingDate = undefined;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
      formValidation: this._validateForm(bdr),
    });
  }

  @autobind
  private _onBillDisclosedChanged(disclosed: string): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.BillDisclosed = disclosed;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onRevenueRaisingChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.RevenueRaising = option.key === "Yes" ? true : false;
    bdr.RevenueRaisingDate = undefined;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
      formValidation: this._validateForm(bdr),
    });
  }

  @autobind
  private _onHasFiscalImpactChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.HasFiscalImpact = option.key;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onContactPersonChanged(value: string): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.ContactPerson = value;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onDateReceivedSelected(date: Date | null | undefined): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.DateReceived = date;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onMemoSentSelected(date: Date | null | undefined): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.RevenueRaisingDate = date;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onBillReleaseChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.ReleaseBill = option.key;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onInfoReceivedMethodChanged(value: string): void {
    const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
    bdr.InfoReceivedMethod = value;
    this.setState({
      ...this.state,
      billDraftRequest: bdr,
    });
  }

  @autobind
  private _onSubmit(): void {
    const tempData: IBillDraftRequest = clone(this.state.billDraftRequest);
    const formValidation: any = this._validateForm(tempData);
    if (formValidation.isValid) {
      this._spinner.setVisibility(true);
      if (tempData.SponsorType === "Committee") {
        tempData.CoSponsor = "";
      }
      this._getSponsorshipClause(tempData).then((sponsorshipClause: string) => {
        tempData.SponsorshipClause = sponsorshipClause;
        tokenProvider.getToken().then((token) => {
          this._billDraftService.save(this.props.httpClient, token, tempData, this.state.canChangeBillType)
            .then((bdr: IBillDraftRequest) => {
              this._spinner.setVisibility(false);
              if (bdr.DrafterId > 0) {
                window.location.href = McsUtil.combinePaths(this.props.webUrl, `${Constants.Pages.DraftingDesktop}?lsonumber=${bdr.LSONumber}`);
              } else {
                window.location.href = McsUtil.combinePaths(this.props.webUrl, `${Constants.Pages.UnassignedDrafts}`);
              }
            }, (err) => { this._spinner.setVisibility(false); this.setState({ ...this.state, error: err }); });
        }, (err) => {
          this._spinner.setVisibility(false);
        });
      });
    } else {
      this._spinner.setVisibility(false);
      this.setState({
        ...this.setState,
        formValidation,
      });
    }
  }

  private _getSponsorshipClause(bdr: IBillDraftRequest): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (bdr.SponsorType === "Committee") {
        resolve(bdr.Sponsor);
      } else {
        if (McsUtil.isString(bdr.CoSponsor)) {
          const sponsorService: SponsorService = new SponsorService(this.props.isLocalEnvironment);
          Promise.all([sponsorService.getSelectedLegislator(bdr.Sponsor),
          sponsorService.getMultipleSelectedLegislators(bdr.CoSponsor)]).then((response) => {
            const sponsor: ILegislator = response[0];
            const cosponsor: ILegislator[] = response[1];
            const sameChamberLegislators: ILegislator[] = cosponsor.filter((v) => v.Chamber === sponsor.Chamber);
            const oppositeChamberLegislators: ILegislator[] = cosponsor.filter((v) => v.Chamber !== sponsor.Chamber);
            let sponsorshipClause: string = bdr.PrimeSponsorshipClause;
            for (let i: number = 0; i < sameChamberLegislators.length; i++) {
              if (i + 1 === sameChamberLegislators.length) {
                sponsorshipClause += " and " + sameChamberLegislators[i].LegislatureName;
              } else {
                sponsorshipClause += ", " + sameChamberLegislators[i].LegislatureName;
              }
            }
            if (oppositeChamberLegislators.length > 0) {
              sponsorshipClause += " and " + oppositeChamberLegislators[0].Title + "(s) " + oppositeChamberLegislators[0].LegislatureName;
              for (let i: number = 1; i < oppositeChamberLegislators.length; i++) {
                if (i + 1 === oppositeChamberLegislators.length) {
                  sponsorshipClause += " and " + oppositeChamberLegislators[i].LegislatureName;
                } else {
                  sponsorshipClause += ", " + oppositeChamberLegislators[i].LegislatureName;
                }
              }
            }
            resolve(sponsorshipClause);
          });
        } else {
          resolve(bdr.PrimeSponsorshipClause);
        }
      }
    });
  }

  @autobind
  private _validateForm(bdr?: IBillDraftRequest): any {
    let formValid: boolean = true;
    if (this.props.isInEditMode) { return formValid; }
    const validation: any = {
      catchTitle: {
        isValid: true,
        errorMessage: "",
      },
      requestor: {
        isValid: true,
        errorMessage: "",
      },
      sponsor: {
        isValid: true,
        errorMessage: "",
      },
      infoReceivedMethod: {
        isValid: true,
        errorMessage: "",
      },
      memoDate: {
        isValid: true,
        errorMessage: "Date is required.",
      },
      draftReceivedBy: {
        isValid: true,
        errorMessage: "",
      },
    };
    if (McsUtil.isDefined(bdr)) {
      if (bdr.RevenueRaising && bdr.HouseofOrigin === "Senate") {
        if (!McsUtil.isString(this._formatDate(bdr.RevenueRaisingDate))) {
          formValid = false;
          validation.memoDate.isValid = false;
        }
      }
      if (!McsUtil.isString(bdr.InfoReceivedMethod)) {
        formValid = false;
        validation.infoReceivedMethod.isValid = false;
        validation.infoReceivedMethod.errorMessage = "Info received method cannot be empty.";
      }
      if (!McsUtil.isString(bdr.DraftReceivedBy)) {
        formValid = false;
        validation.draftReceivedBy.isValid = false;
        validation.draftReceivedBy.errorMessage = "Draft Receiver cannot be empty.";
      }

      if (!McsUtil.isString(bdr.Sponsor)) {
        formValid = false;
        validation.sponsor.isValid = false;
        validation.sponsor.errorMessage = "Sponsor cannot be empty.";
      }
      if (!McsUtil.isString(bdr.Requestor)) {
        formValid = false;
        validation.requestor.isValid = false;
        validation.requestor.errorMessage = "Requestor cannot be empty.";
      }
      if (!McsUtil.isString(bdr.CatchTitle)) {
        formValid = false;
        validation.catchTitle.isValid = false;
        validation.catchTitle.errorMessage = "Catch title cannot be empty.";
      } else {
        if (bdr.CatchTitle.length > 255) {
          formValid = false;
          validation.catchTitle.isValid = false;
          validation.catchTitle.errorMessage = "Catch title longer than 255 character.";
        } else {
          const catchTitle: string = bdr.CatchTitle.trim();
          if (catchTitle[0].toUpperCase() !== catchTitle[0]) {
            formValid = false;
            validation.catchTitle.isValid = false;
            validation.catchTitle.errorMessage = "Catch title must start with upper case.";
          } else {
            if (catchTitle[catchTitle.length - 1] !== ".") {
              formValid = false;
              validation.catchTitle.isValid = false;
              validation.catchTitle.errorMessage = "Catch title must end with period.";
            }
          }
        }
      }
    }
    validation.isValid = McsUtil.isDefined(bdr) ? formValid : false;
    return validation;
  }

  private _getData(): void {
    const peopleService: PeopleService = new PeopleService();
    if (this.state.billDraftRequest.Id > 0 || McsUtil.isString(this.state.billDraftRequest.LSONumber)) {
      let bdrPromise: Promise<IBillDraftRequest>;
      if (this.state.billDraftRequest.Id > 0) {
        bdrPromise = this._billDraftService.getBillDraftById(this.state.billDraftRequest.Id);
      } else {
        bdrPromise = this._billDraftService.getBillDraftByLsoNumber(this.state.billDraftRequest.LSONumber);
      }
      bdrPromise.then((data: IBillDraftRequest) => {
        Promise.all([
          peopleService.loadUserById(data.DrafterId),
          peopleService.loadUserByName(data.DraftReceivedBy),
          this._billDraftService.getBill(data.LSONumber)])
          .then((response) => {
            const drafter: SiteUserProps = response[0];
            const receivedByUser: SiteUserProps = response[1];
            const bill: IBills = response[2];
            if (drafter != null) {
              this._userInfo.DrafterToPersona = peopleService.getPersonaPropForUser(drafter);
            }
            if (receivedByUser != null) {
              this._userInfo.ReceiverToPersona = peopleService.getPersonaPropForUser(receivedByUser);
            }
            const validation: any = this._validateForm(data);
            this.setState({
              ...clone(this.state),
              loading: false,
              billDraftRequest: data,
              formValidation: validation,
              canChangeBillType: bill.DocumentStatus === "Working Draft",
            });
          });
      }, (err) => {
        this.setState({
          ...this.state,
          loading: false,
          canChangeBillType: false,
          error: "Error while loading bill draft request ",
        });
      });
    } else {
      peopleService.loadCurrentUser().then((value) => {
        const bdr: IBillDraftRequest = clone(this.state.billDraftRequest);
        if (McsUtil.isDefined(value)) {
          bdr.DraftReceivedBy = value.Title;
          this._userInfo.ReceiverToPersona = peopleService.getPersonaPropForUser(value);
          this.setState({
            ...this.state,
            billDraftRequest: bdr,
            loading: false,
            canChangeBillType: true,
          });
        }
      });
    }
  }
}
