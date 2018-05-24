import * as React from "react";
import styles from "./FiscalNoteForm.module.scss";
import { IFiscalNoteFormProps } from "./IFiscalNoteFormProps";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import {
  autobind,
  Label,
  Dropdown, IDropdownOption,
  ChoiceGroup, IChoiceGroupOption,
  TextField,
  ActionButton, PrimaryButton, DefaultButton,
  Checkbox,
} from "office-ui-fabric-react";

import { IFiscalNoteState, IFormValidation, IFieldValidation } from "./IFiscalNoteState";
import { AgencyControl } from "../../fiscalNoteDirective/components/AgencyControl";
import { AgencyContactControl } from "./AgencyContactControl";
import {
  IFiscalNoteAgencyContact, IFiscalNoteForm, INonAdminAnticipatedExpenditure,
  INonAdminAnticipatedRevenue, IAppropriationsAgency, IAdminImpactAgency, IFiscalNoteYear,
} from "./IFiscalNoteForm";
import { clone } from "@microsoft/sp-lodash-subset";
import { McsUtil, config, apiHelper, IBills, IBillApi, Constants, IAgencyContact, tokenProvider } from "mcs-lms-core";
import { AnticipatedRevenueControl } from "./AnticipatedRevenueControl";
import { AnticipatedExpenditureControl } from "./AnticipatedExpenditureControl";
import { AppropriationAgencyControl } from "./AppropriationAgencyControl";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";

import { PeopleService } from "../../../services/PeopleService";
import { Loading, Error } from "../../../controls/Loading/Loading";
import { AdminImpactAgencyControl } from "./AdministrativeImpactAgencyControl";
import { FiscalFormService, FiscalType } from "../../../services/FiscalFormService";
import SpinnerControl from "../../../controls/Loading/SpinnerControl";

export default class FiscalNoteForm extends React.Component<IFiscalNoteFormProps, IFiscalNoteState> {
  private readonly _service: FiscalFormService = new FiscalFormService(FiscalType.FiscalNote);
  private _billApi: IBillApi;
  private _bill: IBills;
  private _uniqueAgencyDdlList: IDropdownOption[];
  private _fiscalFundDdlList: IDropdownOption[];
  private _fiscalSeriesDdlList: IDropdownOption[];
  private _currentFiscalNoteYear: IFiscalNoteYear;
  private _spinner: SpinnerControl;

  constructor(props: IFiscalNoteFormProps, context?: any) {
    super(props);
    this._bill = null;
    this._billApi = apiHelper.getBillsApi(false);
    this._uniqueAgencyDdlList = [{ key: "", text: "Select a code" }];
    this._fiscalFundDdlList = [{ key: "", text: "Select a Fund" }];
    this._fiscalSeriesDdlList = [{ key: "", text: "Select a Series" }];
    this.state = {
      loading: true,
      error: undefined,
      data: null,
      currentYear: {} as IFiscalNoteYear,
      formValidation: {
        IsValid: false,
        FieldValidations: [],
      },
    };
    this._currentFiscalNoteYear = {} as IFiscalNoteYear;
  }

  public componentDidMount(): void {
    tokenProvider.isSignedIn().then((isSignedIn) => {
      this.setState({ ...this.state, signedIn: true });
    }, (err) => {
      this.setState({ ...this.state, error: err, signedIn: false });
    });
  }

  public render(): React.ReactElement<IFiscalNoteFormProps> {
    const { data, loading, error } = this.state;
    return (
      <div className={styles.fiscalNoteForm} >
        <div className={styles.container}>
          <WebpartHeader webpartTitle="Fiscal Note Form" />
          {loading && <Loading />}
          {!loading && (McsUtil.isString(error)) && <Error message={error} />}
          {!loading && error === "" &&
            <section id="fiscalNoteForm">
              <div className={styles.row}>
                <div className={styles.column4}><Label className={styles.header}>LSO Number:</Label><Label>{this._handleLabel(data.LSONumber)}</Label></div>
                <div className={styles.column4}><Label className={styles.header}>Bill Number:</Label><Label>{this._handleLabel(data.BillNumber)}</Label></div>
                <div className={styles.column4}><Label className={styles.header}>Document Version:</Label><Label>{this._handleLabel(data.BillDocumentVersion)}</Label></div>
              </div>
              <div className={styles.row}>
                <div className={styles.column12}><Label className={styles.header}>Catch Title:</Label><Label>{this._handleLabel(data.CatchTitle)}</Label></div>
              </div>
              <div className={styles.row}>
                <div className={styles.column12}><Label className={styles.header}>Sponsor:</Label><Label>{this._handleLabel(data.Sponsor)}</Label></div>
              </div>
              <hr />
              <div className={styles.row}>
                <div className={styles.column12}><PrimaryButton onClick={this._refreshBillInfo} className={styles.button} text="Refresh Bill Information" /></div>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>IMPACT DETERMINABILITY</legend>
                <div className={styles.row}>
                  <div className={styles.column8}>
                    <ChoiceGroup className={styles.inlineflex} selectedKey={data.Determinability ? "Yes" : "No"}
                      onChange={this._determinabilityChanged} options={this._getDeterminabilities()} />
                  </div>
                  <div className={styles.column4Margin}>
                    <Dropdown required={true} selectedKey={data.DeterminabilityReason} disabled={data.Determinability}
                      options={this._getDeterminabilityReasons()} onChanged={this._reasonChanged} />
                  </div>
                </div>
              </fieldset>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>APPROPRIATE/PERSONNEL AUTHORIZATION IN BILL AS INTRODUCED</legend>
                <div className={styles.row}>
                  <div className={styles.column12}>
                    <Checkbox label="This bill contains appropriations" checked={data.ContainsAppropriation} onChange={this._containAppropriation} />
                  </div>
                </div>
                {data.AppropriationsAgencies && data.AppropriationsAgencies.length > 0 &&
                  data.AppropriationsAgencies.map((agency, index) => {
                    return <AppropriationAgencyControl
                      remove={this._removeAppropriationAgency}
                      appropriationAgency={agency}
                      agencyList={this._uniqueAgencyDdlList}
                      fundList={this._fiscalFundDdlList}
                      seriesList={this._fiscalSeriesDdlList}
                      index={index}
                      onChanged={this._agenciesChanged}
                      currentYear={this.state.currentYear}
                    />;
                  })
                }
                <div className={styles.column12 + " " + styles.borderedTop}>
                  <ActionButton data-automation-id="insertAppropriationAgencies" disabled={!data.ContainsAppropriation}
                    iconProps={{ iconName: "Add" }} onClick={this._insertAppropriationAgencies}>Insert agency</ActionButton>
                </div>

                <div className={styles.row}>
                  <div className={styles.column12}>
                    <Checkbox checked={data.AnticipatedIncreasePersonnel} label="This bill contains personnel authorizations" onChange={this._increasePersonnel} />
                  </div>
                </div>
                {!data.AnticipatedIncreasePersonnel && <div className={styles.row}>
                  <div className={styles.column4}>
                    <TextField
                      className={styles.fieldpadding}
                      label="Full Time Positions:"
                      value={data.FTPos.toString()}
                      type="number"
                      onChanged={this._ftPosChanged} />
                  </div>
                  <div className={styles.column4}>
                    <TextField className={styles.fieldpadding}
                      label="Part Time Positions"
                      type="number"
                      value={data.PTPos.toString()}
                      onChanged={this._ptPosChanged} />
                  </div>
                  <div className={styles.column4}>
                    <TextField
                      className={styles.fieldpadding}
                      label="AWEC Positions"
                      type="number"
                      value={data.AWECPos.toString()}
                      onChanged={this._awecPosChanged} />
                  </div>
                </div>}
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>FISCAL IMPACT-NON-ADMINISTRATIVE</legend>
                <div className={styles.row}>
                  <div className={styles.column6}>
                    <ChoiceGroup selectedKey={data.NonAdministrativeImpact ? "Yes" : "No"}
                      options={this._getNonAdminImpacts()} onChange={this._nonAdminImpactChanged} />
                  </div>
                  <div className={styles.column6}>
                    Please include dollar increase and decreases in revenues to state from taxes, fees, and charges for services
                    etc., changes in the flow of any such revenues, and dollar increases and decreases in benefits, claims,
                    grants-in-aid payments, etc.</div>
                </div>
                {data.NonAdministrativeImpact && <div>
                  <fieldset className={styles.fieldset}>
                    <div className={styles.row}>
                      <div className={styles.column12}>
                        <Label className={styles.header}>Anticipated Revenue</Label></div>
                    </div>
                    <div className={styles.row + " " + styles.backgroundColor}>
                      <div className={styles.column3}>
                        <Label>Fund</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>FY{this.state.currentYear.RevExpYearDisplay1}</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>FY{this.state.currentYear.RevExpYearDisplay2}</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>FY{this.state.currentYear.RevExpYearDisplay3}</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>Type</Label>
                      </div>
                      <div className={styles.column1}>
                      </div>
                    </div>
                    {data.NonAdminAnticipatedRevenues && data.NonAdminAnticipatedRevenues.length > 0 &&
                      data.NonAdminAnticipatedRevenues.map((revenue, index) => {
                        return <AnticipatedRevenueControl
                          remove={this._removeNonAnticipatedRevenue}
                          anticipatedRevenue={revenue}
                          fundList={this._fiscalFundDdlList}
                          index={index}
                          onChanged={this._revenueChanged} />;
                      })
                    }
                    <div className={styles.row + " " + styles.borderedTop}>
                      <div className={styles.column12}>
                        <ActionButton data-automation-id="insertAnticipatedRevenue"
                          iconProps={{ iconName: "Add" }}
                          onClick={this._insertAnticipatedRevenue}>Insert Anticipated Revenue</ActionButton>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className={styles.fieldset}>
                    <div className={styles.row}>
                      <div className={styles.column12}>
                        <Label className={styles.header}>Anticipated Expenditure</Label>
                      </div>
                    </div>
                    <div className={styles.row + " " + styles.backgroundColor}>
                      <div className={styles.column3}>
                        <Label>Fund</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>FY{this.state.currentYear.RevExpYearDisplay1}</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>FY{this.state.currentYear.RevExpYearDisplay2}</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>FY{this.state.currentYear.RevExpYearDisplay3}</Label>
                      </div>
                      <div className={styles.column2}>
                        <Label>Type</Label>
                      </div>
                      <div className={styles.column1}>
                      </div>
                    </div>
                    {data.NonAdminAnticipatedExpenditures && data.NonAdminAnticipatedExpenditures.length > 0 &&
                      data.NonAdminAnticipatedExpenditures.map((expenditure, index) => {
                        return <AnticipatedExpenditureControl
                          remove={this._removeNonAnticipatedExpenditure}
                          fundList={this._fiscalFundDdlList}
                          anticipatedExpenditure={expenditure}
                          index={index}
                          onChanged={this._expenditureChanged} />;
                      })
                    }
                    <div className={styles.row + " " + styles.borderedTop}>
                      <div className={styles.column12}>
                        <ActionButton data-automation-id="insertAnticipatedExpenditure"
                          iconProps={{ iconName: "Add" }} onClick={this._insertAnticipatedExpenditure}>Insert Anticipated Expenditure</ActionButton>
                      </div>
                    </div>
                  </fieldset></div>}
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Fiscal Impact - Administrative</legend>
                <div className={styles.row}>
                  <div className={styles.column12}>
                    <Label>Please indicate if this bill is anticipated to have an administrative impact.</Label>
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.column12}>
                    <ChoiceGroup selectedKey={data.AdminstrativeImpact ? "Yes" : "No"}
                      options={this._getAdminImpacts()} onChange={this._adminImpactChanged} />
                  </div>
                </div>
                {data.AdminstrativeImpact && <div>
                  <div className={styles.row}>
                    <div className={styles.column12}>
                      <Label className={styles.header}>Agencies:</Label>
                    </div>
                  </div>
                  {data.AdministrativeImpactAgencies && data.AdministrativeImpactAgencies.length > 0 &&
                    data.AdministrativeImpactAgencies.map((agency, index) => {
                      return <AdminImpactAgencyControl
                        remove={this._removeAdminImpactAgency}
                        Agency={agency}
                        index={index}
                        agencyList={this._uniqueAgencyDdlList}
                        onChanged={this._adminImpactAgencyChanged} />;
                    })}
                  <div className={styles.row + " " + styles.borderedTop}>
                    <div className={styles.column12}>
                      <ActionButton data-automation-id="insertAdminImpactAgency"
                        iconProps={{ iconName: "Add" }} onClick={this._insertAdminImpactAgency}>Insert Item</ActionButton>
                    </div>
                  </div>
                </div>}
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>AGENCY CONTACT INFORMATION</legend>
                <div className={styles.row + " " + styles.backgroundColor}>
                  <div className={styles.column4}>
                    <Label>Agency</Label>
                  </div>
                  <div className={styles.column3}>
                    <Label>Contact Name</Label>
                  </div>
                  <div className={styles.column3}>
                    <Label>Contact Phone</Label>
                  </div>
                  <div className={styles.column2}>
                  </div>
                </div>
                {data.FiscalNoteAgencyContacts && data.FiscalNoteAgencyContacts.length > 0 &&
                  data.FiscalNoteAgencyContacts.map((agency, index) => {
                    return <AgencyContactControl remove={this._removeAgencyContact} agencyList={this._uniqueAgencyDdlList}
                      AgencyContact={agency} key={index} index={index} onChanged={this._contactChanged} />;
                  })
                }
                <div className={styles.row + " " + styles.borderedTop}>
                  <div className={styles.column12}>
                    <ActionButton data-automation-id="insertAgencyContact" iconProps={{ iconName: "Add" }} onClick={this._insertAgencyContact}>Insert Item</ActionButton>
                  </div>
                </div>
              </fieldset>
              <fieldset className={styles.fieldset}>
                <div className={styles.row}>
                  <div className={styles.column12}>
                    <Checkbox label="Check this box to regenerate the fiscal note (overwriting previous fiscal note)"
                      onChange={this._onRegenerateChecked} />
                  </div>
                </div>
              </fieldset>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Prepared By </legend>
                <div className={styles.row}>
                  <div className={styles.column6}>
                    <TextField className={styles.fieldpadding} label="First Name" required={true} errorMessage={this._getValidationForField("PreparedByFirstName")}
                      value={data.PreparedByFirstName} onChanged={this._preparedByFNChanged} />
                  </div>
                  <div className={styles.column6}>
                    <TextField className={styles.fieldpadding} label="Last Name" required={true} errorMessage={this._getValidationForField("PreparedByLastName")}
                      value={data.PreparedByLastName} onChanged={this._preparedByLNChanged} />
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
                <div className={styles.column8}>
                  <DefaultButton className={styles.button} text="Update & Save" onClick={this._saveFiscalNote} />
                  <DefaultButton className={styles.button} text="Cancel" onClick={this._cancel} />
                </div>
              </div>
              <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
            </section>}
        </div>
      </div >
    );
  }

  public componentDidUpdate(prevProps: IFiscalNoteFormProps, prevState: IFiscalNoteState, prevContext: any): void {
    if (prevState.signedIn !== this.state.signedIn && !McsUtil.isDefined(this.state.hasToken)) {
      tokenProvider.getToken().then((token) => {
        this._getData();
        this.setState({ ...this.state, hasToken: true });
      }, (err) => {
        this.setState({ ...this.state, hasToken: false });
      });
    }
  }

  private _handleLabel(value: any): string {
    if (McsUtil.isDefined(value)) {
      return value as string;
    }
    return "-";
  }

  @autobind
  private _onRegenerateChecked(ev: React.FormEvent<HTMLElement>, isChecked: boolean): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.RegenerateFiscalNote = isChecked;
    this._setState(data);
  }

  private _setErrorState(error?: string): void {
    if (!McsUtil.isString(error)) {
      if (!McsUtil.isDefined(this.state.data) || !McsUtil.isString(this.state.data.LSONumber)) {
        error = "LsoNumber is required.";
      } else {
        if (this.state.data.BillId <= 0) {
          error = "Invalid LSONumber";
        }
      }
    }
    this.setState({ ...this.state, error, loading: false });
  }

  @autobind
  private _insertAgencyContact(): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    if (!McsUtil.isArray(data.FiscalNoteAgencyContacts)) {
      data.FiscalNoteAgencyContacts = [];
    }
    data.FiscalNoteAgencyContacts.push({
      Agency: "",
      AgencyName: "",
      ContactName: "",
      ContactPhone: "",
      FiscalNoteId: data.Id,
    } as IFiscalNoteAgencyContact);
    this._setState(data);
  }

  @autobind
  private _insertAnticipatedExpenditure(): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    if (!McsUtil.isArray(data.NonAdminAnticipatedExpenditures)) {
      data.NonAdminAnticipatedExpenditures = [];
    }
    data.NonAdminAnticipatedExpenditures.push({
      AnticipatedExpenditureY1: 0,
      AnticipatedExpenditureY2: 0,
      AnticipatedExpenditureY3: 0,
      AnticipatedExpenditureType: "",
      AnticipatedExpenditureFund: "",
      AnticipatedExpenditureFundDescription: "",
      FiscalNoteId: data.Id,
    } as INonAdminAnticipatedExpenditure);
    this._setState(data);
  }

  @autobind
  private _insertAnticipatedRevenue(): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    if (!McsUtil.isArray(data.NonAdminAnticipatedRevenues)) {
      data.NonAdminAnticipatedRevenues = [];
    }
    data.NonAdminAnticipatedRevenues.push({
      AnticipatedRevenueY1: 0,
      AnticipatedRevenueY2: 0,
      AnticipatedRevenueY3: 0,
      AnticipatedRevenueType: "",
      AnticipatedRevenueFund: "",
      AnticipatedRevenueFundDescription: "",
      FiscalNoteId: data.Id,
    } as INonAdminAnticipatedRevenue);
    this._setState(data);
  }

  @autobind
  private _insertAppropriationAgencies(): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    if (!McsUtil.isArray(data.AppropriationsAgencies)) {
      data.AppropriationsAgencies = [];
    }
    data.AppropriationsAgencies.push({
      Id: 0,
      AppropriationsAgency1: "",
      AppropriationsAgencyName: "",
      AppropriationsUnit: "",
      FiscalNoteId: this._handleNumber(data.Id),
      AppropriationsAgenciesFunds: [{
        Id: 0,
        AppropriationsFund: "",
        AppropriationsFundDescription: "",
        AppropriationsAmount: 0,
        AppropriationsEffImm: false,
        FiscalNoteId: this._handleNumber(data.Id),
        AppropriationsAgenciesId: 0,
      }],
      AppropriationsAgenciesSeries: [{
        Id: 0,
        AppropriationSeries: "",
        AppropriationsSeriesName: "",
        AppropriationSeriesY1: 0,
        AppropriationSeriesY2: 0,
        AppropriationSeriesY3: 0,
        FiscalNoteId: this._handleNumber(data.Id),
        AppropriationsAgenciesId: 0,
      }],
    } as IAppropriationsAgency);
    this._setState(data);
  }

  @autobind
  private _insertAdminImpactAgency(): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    if (!McsUtil.isArray(data.AdministrativeImpactAgencies)) {
      data.AdministrativeImpactAgencies = [];
    }
    data.AdministrativeImpactAgencies.push({
      Id: 0,
      FiscalNoteId: this._handleNumber(data.Id),
      AdminImpactAgencies: "",
    } as IAdminImpactAgency);
    this._setState(data);
  }

  @autobind
  private _agenciesChanged(value: IAppropriationsAgency, index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.AppropriationsAgencies[index] = value;
    this._setState(data);
  }

  @autobind
  private _removeAppropriationAgency(index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.AppropriationsAgencies.splice(index, 1);
    this._setState(data);
  }

  @autobind
  private _revenueChanged(value: INonAdminAnticipatedRevenue, index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.NonAdminAnticipatedRevenues[index] = value;
    this._setState(data);
  }

  @autobind
  private _removeNonAnticipatedRevenue(index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.NonAdminAnticipatedRevenues.splice(index, 1);
    this._setState(data);
  }

  @autobind
  private _expenditureChanged(value: INonAdminAnticipatedExpenditure, index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.NonAdminAnticipatedExpenditures[index] = value;
    this._setState(data);
  }

  @autobind
  private _removeNonAnticipatedExpenditure(index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.NonAdminAnticipatedExpenditures.splice(index, 1);
    this._setState(data);
  }

  @autobind
  private _contactChanged(value: IFiscalNoteAgencyContact, index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.FiscalNoteAgencyContacts[index] = value;
    this._setState(data);
  }

  @autobind
  private _removeAgencyContact(index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.FiscalNoteAgencyContacts.splice(index, 1);
    this._setState(data);
  }

  @autobind
  private _determinabilityChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.Determinability = option.key === "Yes";
    this._setState(data);
  }

  @autobind
  private _reasonChanged(option: IDropdownOption, index?: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.DeterminabilityReason = option.key as string;
    this._setState(data);
  }

  @autobind
  private _increasePersonnel(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.AnticipatedIncreasePersonnel = checked;
    if (!checked) {
      data.FTPos = 0;
      data.PTPos = 0;
      data.AWECPos = 0;
    }
    this._setState(data);
  }

  @autobind
  private _ftPosChanged(value: string): void {
    if (McsUtil.isNumberString(value)) {
      const data: IFiscalNoteForm = clone(this.state.data);
      data.FTPos = this._handleNumber(value);
      this._setState(data);
    }
  }

  @autobind
  private _ptPosChanged(value: string): void {
    if (McsUtil.isNumberString(value)) {
      const data: IFiscalNoteForm = clone(this.state.data);
      data.PTPos = this._handleNumber(value);
      this._setState(data);
    }
  }

  @autobind
  private _awecPosChanged(value: string): void {
    if (McsUtil.isNumberString(value)) {
      const data: IFiscalNoteForm = clone(this.state.data);
      data.AWECPos = this._handleNumber(value);
      this._setState(data);
    }
  }

  @autobind
  private _nonAdminImpactChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.NonAdministrativeImpact = option.key === "Yes";
    if (data.NonAdministrativeImpact) {
      data.NonAdminAnticipatedExpenditures = [];
      data.NonAdminAnticipatedRevenues = [];
    }
    this._setState(data);
  }

  @autobind
  private _adminImpactChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.AdminstrativeImpact = option.key === "Yes";
    if (data.AdminstrativeImpact) {
      data.AdministrativeImpactAgencies = [];
    }
    this._setState(data);
  }

  @autobind
  private _removeAdminImpactAgency(index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.AdministrativeImpactAgencies.splice(index, 1);
    this._setState(data);
  }

  @autobind
  private _adminImpactAgencyChanged(value: IAdminImpactAgency, index: number): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.AdministrativeImpactAgencies[index] = value;
    this._setState(data);
  }

  @autobind
  private _containAppropriation(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.ContainsAppropriation = checked;
    if (!checked) {
      data.AppropriationsAgencies = [];
    }
    this._setState(data);
  }

  @autobind
  private _preparedByFNChanged(value: string): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.PreparedByFirstName = value;
    this._setState(data);
  }

  @autobind
  private _preparedByLNChanged(value: string): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.PreparedByLastName = value;
    this._setState(data);
  }

  @autobind
  private _preparedByTitleChanged(value: string): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.PreparedByTitle = value;
    this._setState(data);
  }

  @autobind
  private _preparedByEmailChanged(value: string): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.PreparedByEmail = value;
    this._setState(data);
  }

  @autobind
  private _preparedByPhoneChanged(value: string): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.PreparedByPhone = value;
    this._setState(data);
  }

  @autobind
  private _preparedByFaxChanged(value: string): void {
    const data: IFiscalNoteForm = clone(this.state.data);
    data.PreparedByFax = value;
    this._setState(data);
  }

  @autobind
  private _saveFiscalNote(): void {
    const tempValidation: IFormValidation = this._validateForm(this.state.data);
    if (tempValidation.IsValid) {
      tokenProvider.getToken().then((token) => {
        if (McsUtil.isDefined(this.props.httpClient)) {
          this._spinner.setVisibility(true);
          if (this.state.data.Id > 0) {
            this._service.updateItem(this.props.httpClient, this._bill, this.state.data, token).then(() => {
              this._spinner.setVisibility(false);
              this._redirect();
            }, () => this._spinner.setVisibility(false));
          } else {
            this._service.addNewItem(this.props.httpClient, this._bill, this.state.data, token).then(() => {
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

  @autobind
  private _refreshBillInfo(): void {
    this._billApi.getBill(this._bill.LSONumber).then((bill) => {
      this._bill = bill;
      const data: IFiscalNoteForm = clone(this.state.data);
      data.BillDocumentVersion = bill.DocumentVersion.toString();
      data.BillNumber = bill.BillNumber;
      data.CatchTitle = bill.CatchTitle;
      data.Sponsor = bill.Sponsor;
      data.LSONumber = bill.LSONumber;
      this._setState(data);
    });
  }

  private _getDeterminabilities(): IChoiceGroupOption[] {
    return [{
      key: "Yes",
      text: "Impact can be determined",
    } as IChoiceGroupOption,
    {
      key: "No",
      text: "Impact cannot be determined because",
    },
    ];
  }

  private _getDeterminabilityReasons(): IDropdownOption[] {
    return [
      { key: "", text: "Select Option Text" },
      { key: "Other", text: "Other" },
      { key: "Unknown Cases", text: "Unknown Cases" },
      { key: "Insufficient Time", text: "Insufficient Time" },
    ];
  }

  private _getNonAdminImpacts(): IChoiceGroupOption[] {
    return [
      {
        key: "No",
        text: "No significant non-administrative impact",
      } as IChoiceGroupOption,
      {
        key: "Yes",
        text: "Significant non-administrative impact",
      },
    ];
  }

  private _getAdminImpacts(): IChoiceGroupOption[] {
    return [
      {
        key: "No",
        text: "No significant administrative impact",
      } as IChoiceGroupOption,
      {
        key: "Yes",
        text: "Significant administrative impact",
      },
    ];
  }

  private _handleNumber(value: any): number {
    return McsUtil.isNumberString(value as string) ? parseInt(value as string, 10) : 0;
  }

  private _setState(data: IFiscalNoteForm): void {
    this.setState({ ...this.state, data, formValidation: this._validateForm(data) });
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
          const defaultValue: IFiscalNoteForm = this._getDefaultValue(lsoNumber, bill);
          const currentYear: number = parseInt(bill.BillYear, 10);
          Promise.all([this._service.getItemByLsoNumber(this.props.httpClient, defaultValue.LSONumber, token),
          peopleService.loadCurrentUserProfile(),
          this._service.getFiscalAgencyContact(),
          this._service.getFiscalFunds(),
          this._service.getFiscalSeries(),
          this._service.getFiscalNoteYearsByYear(this.props.httpClient, token, currentYear),
          ]).then((responses) => {
            const userProfileProperties: any = responses[1];
            defaultValue.PreparedByFirstName = this._getUserPropertyValue(userProfileProperties, "FirstName");
            defaultValue.PreparedByLastName = this._getUserPropertyValue(userProfileProperties, "LastName");
            defaultValue.PreparedByEmail = this._getUserPropertyValue(userProfileProperties, "WorkEmail");
            defaultValue.PreparedByPhone = this._getUserPropertyValue(userProfileProperties, "WorkPhone");
            defaultValue.PreparedByFax = this._getUserPropertyValue(userProfileProperties, "Fax");
            defaultValue.PreparedByTitle = this._getUserPropertyValue(userProfileProperties, "Title");

            const fiscalNote: IFiscalNoteForm = McsUtil.isDefined(responses[0]) ? responses[0] : defaultValue;
            fiscalNote.ModifiedBy = this._getUserPropertyValue(userProfileProperties, "UserName");
            fiscalNote.ModifiedDate = new Date();
            this._uniqueAgencyDdlList = this._getAgencyCodes(this._service.getUniqueAgency(responses[2]));
            this._fiscalFundDdlList = [{ key: "", text: "Select a Fund" }].concat(
              responses[3].map((f) => {
                return { key: f.Title, text: f.FiscalFundDescription };
              }),
            );
            this._fiscalSeriesDdlList = [{ key: "", text: "Select a Series" }].concat(
              responses[4].map((f) => {
                return { key: f.Title, text: f.FiscalSeriesDescription };
              }),
            );
            if (McsUtil.isArray(responses[5]) && responses[5].length > 0) {
              this._currentFiscalNoteYear = responses[5][0];
            } else {
              this._currentFiscalNoteYear = {
                CurrentYear: currentYear,
                RevExpYearDisplay1: currentYear + 1,
                RevExpYearDisplay2: currentYear + 2,
                RevExpYearDisplay3: currentYear + 3,
                SeriesYearDisplay1: currentYear,
                SeriesYearDisplay2: currentYear + 1,
                SeriesYearDisplay3: currentYear + 2,
                SeriesYearDisplay4: currentYear + 3,
              } as IFiscalNoteYear;
            }
            this.setState({
              ...this.state,
              data: fiscalNote,
              loading: false,
              currentYear: this._currentFiscalNoteYear,
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

  private _getDefaultValue(lsoNumber: string, bill?: IBills): IFiscalNoteForm {
    return {
      BillId: 0,
      LSONumber: McsUtil.isDefined(bill) ? bill.LSONumber : "",
      CatchTitle: McsUtil.isDefined(bill) ? bill.CatchTitle : "",
      BillNumber: McsUtil.isDefined(bill) ? `${bill.BillNumber}` : "",
      BillDocumentVersion: McsUtil.isDefined(bill) ? `${bill.DocumentVersion}` : "",
      Sponsor: McsUtil.isDefined(bill) ? bill.Sponsor : "",
      PreparedByFirstName: "",
      PreparedByLastName: "",
      PreparedByTitle: "",
      PreparedByPhone: "",
      PreparedByEmail: "",
      PreparedByFax: "",
      NonAdministrativeImpact: false,
      AdminstrativeImpact: false,
      ContainsAppropriation: false,
      AnticipatedIncreasePersonnel: false,
      FTPos: 0,
      PTPos: 0,
      AWECPos: 0,
      RegenerateFiscalNote: false,
      Message: "",
      Determinability: true,
      DeterminabilityReason: "",
      FiscalNoteYearId: 0,
      AdministrativeImpactAgencies: [],
      AppropriationsAgencies: [],
      FiscalNoteAgencyContacts: [],
      NonAdminAnticipatedExpenditures: [],
      NonAdminAnticipatedRevenues: [],
    } as IFiscalNoteForm;
  }

  // validation part
  private _validateForm(data: IFiscalNoteForm): IFormValidation {
    const formValidation: IFormValidation = {
      IsValid: true,
      FieldValidations: [
        this._validateField("PreparedByFirstName", McsUtil.isString(data.PreparedByFirstName)),
        this._validateField("PreparedByLastName", McsUtil.isString(data.PreparedByLastName)),
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
