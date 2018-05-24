import * as React from "react";
import styles from "./FiscalImpact.module.scss";
import { IFiscalImpactProps } from "./IFiscalImpactProps";
import { escape, clone } from "@microsoft/sp-lodash-subset";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import {
  autobind,
  Label,
  PrimaryButton, ActionButton, DefaultButton,
  DatePicker,
  ChoiceGroup, IChoiceGroupOption,
  TextField,
  Checkbox,
} from "office-ui-fabric-react";
import { AgencyEmailControl } from "./AgencyEmailControl";
import IFiscalImpactForm, { IFiscalImpactAgencyInfo, IFiscalImpactAttachment } from "./IFiscalImpactForm";
import { IFiscalImpactState, IFormValidation, IFieldValidation } from "./IFiscalImpactState";
import {
  McsUtil, config, apiHelper, IBillApi, IBills, IAgencyContact,
  Constants, tokenProvider,
} from "mcs-lms-core";
import { AttachmentControl } from "./AttachmentControl";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import { PeopleService } from "../../../services/PeopleService";
import { Loading, Error } from "../../../controls/Loading/Loading";
import { SiteUserProps } from "sp-pnp-js";
import { FiscalFormService, FiscalType } from "../../../services/FiscalFormService";
import { IFiscalDirectiveForm, IFiscalDirectiveAgency } from "../../fiscalNoteDirective/components/IFiscalDirectiveForm";
import SpinnerControl from "../../../controls/Loading/SpinnerControl";

export default class FiscalImpact extends React.Component<IFiscalImpactProps, IFiscalImpactState> {
  private _authCtx: adal.AuthenticationContext;
  private readonly _service: FiscalFormService = new FiscalFormService(FiscalType.FiscalImpactRequest);
  private readonly _billApi: IBillApi;
  private _bill: IBills;
  private _agencyList: IAgencyContact[];
  private _spinner: SpinnerControl;

  constructor(props: IFiscalImpactProps, context?: any) {
    super(props);
    this._bill = null;
    this._agencyList = [];
    this.state = {
      loading: true,
      error: undefined,
      data: null,
      formValidation: {
        IsValid: false,
        FieldValidations: [],
      },
    };
    this._billApi = apiHelper.getBillsApi(false);
  }

  public componentDidMount(): void {
    this._authCtx.handleWindowCallback();
    if (window !== window.top) {
      return;
    }
    this.setState({ ...this.state, error: this._authCtx.getLoginError(), signedIn: !(!this._authCtx.getCachedUser()) });
  }

  public render(): React.ReactElement<IFiscalImpactProps> {
    const { data, error, loading } = this.state;
    return (
      <div className={styles.fiscalForm} >
        <div className={styles.container}>
          <WebpartHeader webpartTitle="Fiscal Impact Package Impact By Agency" />
          {loading && <Loading />}
          {!loading && (McsUtil.isString(error)) && <Error message={error} />}
          {!loading && error === "" && (<div className={styles.row}>
            <div className={styles.column12}>
              <fieldset className={styles.fieldset}>
                <div className={styles.row}>
                  <div className={styles.column4}>
                    <Label className={styles.header}>Lso Number:</Label><Label>{this._handleLabel(data.LSONumber)}</Label>
                  </div>
                  <div className={styles.column4}>
                    <Label className={styles.header}>Bill Number:</Label><Label>{this._handleLabel(data.BillNumber)}</Label>
                  </div>
                  <div className={styles.column4}>
                    <Label className={styles.header}>Version:</Label><Label>{this._handleLabel(data.BillDocumentVersion)}</Label>
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.column12}>
                    <Label className={styles.header}>Catch Title:</Label><Label>{this._handleLabel(data.CatchPhrase)}</Label>
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.column6}>
                    <Label className={styles.header}>Bill Sponsor:</Label><Label>{this._handleLabel(data.BillSponsor)}</Label>
                  </div>
                  <div className={styles.column6}>
                    <Label className={styles.header}>Bill Status:</Label><Label>{this._handleLabel(data.BillStatus)}</Label>
                  </div>
                </div>
              </fieldset>

              <div className={styles.row}>
                <div className={styles.column12}>
                  <PrimaryButton className={styles.button} onClick={this._refreshBillInfo} text="Refresh Bill Information" />
                </div>
              </div>

              <fieldset className={styles.fieldset}>
                <div className={styles.row}>
                  <div className={styles.column6} >
                    <div className={styles.inlineInput}>
                      <DatePicker value={this._getDate(data.FiscalImpactDueDate)} label="Please return by:"
                        isRequired={true} allowTextInput={false} isMonthPickerVisible={false}
                        onSelectDate={this._onFiscalImpactDueDateSelected} placeholder="Select date received..." />
                    </div>
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.column6}>
                    <ChoiceGroup label="Packet type:" selectedKey={data.PacketType} onChange={this._packetTypeChosen}
                      options={this._getPacketTypesOptions()} />
                  </div>
                  <div className={styles.column6}>
                    <ChoiceGroup label="Cancel previous requests:" selectedKey={data.CancelPreviousRequests}
                      onChange={this._cancelPreviousRequests} options={this._getCancelRequestOptions()} />
                  </div>
                </div>
              </fieldset>

              {data.FiscalImpactAgencyInfoes && data.FiscalImpactAgencyInfoes.length > 0 &&
                data.FiscalImpactAgencyInfoes.map((agency, index) => {
                  return <AgencyEmailControl
                    removeInfo={this._removeInfo}
                    agencyInfo={agency}
                    index={index}
                    agencyList={this._agencyList}
                    onChanged={this._agencyInfoChanged} />;
                })
              }
              <div className={styles.column12}>
                <ActionButton data-automation-id="insertAgency" iconProps={{ iconName: "Add" }} onClick={this._insertAgency}>Insert Additional Agency</ActionButton>
              </div>

              <div className={styles.row}>
                <div className={styles.column12 + " " + styles.marginComment}>
                  <TextField label="Comments:" className={styles.commentSize} multiline rows={4} value={data.OtherComments} onChanged={this._otherCommentsChanged} />
                </div>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Email Attachments: </legend>
                {data.FiscalImpactAttachments && data.FiscalImpactAttachments.length > 0 &&
                  data.FiscalImpactAttachments.map((attachment, index) => {
                    return <AttachmentControl removeAttachment={this._removeAttachment} attachment={attachment} key={index} index={index} />;
                  })
                }
                <div className={styles.column12}>
                  <ActionButton data-automation-id="insertAttachment" iconProps={{ iconName: "Add" }} onClick={this._insertAttachment}>Insert Attachment</ActionButton>
                </div>
              </fieldset>

              <fieldset>
                <div className={styles.row}>
                  <div className={styles.column6}>
                    <Checkbox label="Send email to agencies" checked={data.SendEmail} onChange={this._sendEmail} />
                  </div>
                  <div className={styles.column6}>
                    <Checkbox label="Send an email copy to me" checked={data.AnalystEmail} onChange={this._analyseEmail} />
                  </div>
                </div>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Prepared By </legend>
                <div className={styles.row}>
                  <div className={styles.column6}>
                    <TextField className={styles.fieldpadding} label="First Name" required={true} errorMessage={this._getValidationForField("PreparedByFirstName")}
                      value={data.PreparedByFirstName} onChanged={this._preparedByFNChanged}
                    />
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
                <div className={styles.column12}>
                  <DefaultButton onClick={this._saveFiscalImpact} className={styles.button} text="Update & Save" />
                  <DefaultButton className={styles.button} text="Cancel" onClick={this._cancel} />
                </div>
              </div>
              <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
            </div>
          </div >)}
        </div >
      </div >
    );
  }

  public componentDidUpdate(prevProps: IFiscalImpactProps, prevState: IFiscalImpactState, prevContext: any): void {
    const isUserSignedIn: boolean = !(!this._authCtx.getCachedUser());
    const loginError: any = this._authCtx.getLoginError();
    if (!isUserSignedIn && !loginError) {
      this._authCtx.login();
    } else {
      if (prevState.signedIn !== this.state.signedIn && !McsUtil.isDefined(this.state.hasToken)) {
        tokenProvider.getToken().then((token) => {
          this._getData(token);
          this.setState({ ...this.state, hasToken: true });
        }, (err) => {
          this.setState({ ...this.state, hasToken: false });
        });
      }
    }

  }

  @autobind
  private _insertAgency(): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    if (!McsUtil.isArray(data.FiscalImpactAgencyInfoes)) {
      data.FiscalImpactAgencyInfoes = [];
    }
    data.FiscalImpactAgencyInfoes.push({
      FiscalImpactAgencyCCs: [
        {
          Id: 0,
          FiscalImpactId: this._handleNumber(data.Id),
          AgencyInfoId: 0,
          CCContactName: "",
          CCEmailAddr: "",
        },
      ],
      Id: 0,
      FiscalImpactId: this._handleNumber(data.Id),
      AgencyName: "",
      DirectorName: "",
      DirectorEmail: "",
    } as IFiscalImpactAgencyInfo);
    this._setState(data);
  }

  @autobind
  private _removeInfo(index: number): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.FiscalImpactAgencyInfoes.splice(index, 1);
    this._setState(data);
  }

  @autobind
  private _insertAttachment(): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    if (!McsUtil.isArray(data.FiscalImpactAttachments)) {
      data.FiscalImpactAttachments = [];
    }
    data.FiscalImpactAttachments.push({
      Id: 0,
      FiscalImpactId: this._handleNumber(data.Id),
      FileName: "",
      Extension: "",
    } as IFiscalImpactAttachment);
    this._setState(data);
  }

  @autobind
  private _removeAttachment(index: number): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.FiscalImpactAttachments.splice(index, 1);
    this._setState(data);
  }

  @autobind
  private _packetTypeChosen(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.PacketType = option.key;
    this._setState(data);
  }

  @autobind
  private _onFiscalImpactDueDateSelected(date: Date | null | undefined): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.FiscalImpactDueDate = date;
    this._setState(data);
  }

  @autobind
  private _cancelPreviousRequests(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.CancelPreviousRequests = option.key;
    this._setState(data);
  }

  @autobind
  private _otherCommentsChanged(value: string): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.OtherComments = value;
    this._setState(data);
  }

  @autobind
  private _sendEmail(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.SendEmail = checked;
    this._setState(data);
  }

  @autobind
  private _analyseEmail(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.AnalystEmail = checked;
    this._setState(data);
  }

  @autobind
  private _preparedByFNChanged(value: string): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.PreparedByFirstName = value;
    this._setState(data);
  }

  @autobind
  private _preparedByLNChanged(value: string): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.PreparedByLastName = value;
    this._setState(data);
  }

  @autobind
  private _preparedByTitleChanged(value: string): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.PreparedByTitle = value;
    this._setState(data);
  }

  @autobind
  private _preparedByEmailChanged(value: string): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.PreparedByEmail = value;
    this._setState(data);
  }

  @autobind
  private _preparedByPhoneChanged(value: string): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.PreparedByPhone = value;
    this._setState(data);
  }

  @autobind
  private _preparedByFaxChanged(value: string): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.PreparedByFax = value;
    this._setState(data);
  }

  @autobind
  private _agencyInfoChanged(value: IFiscalImpactAgencyInfo, index: number): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    data.FiscalImpactAgencyInfoes[index] = value;
    this._setState(data);
  }

  @autobind
  private _refreshBillInfo(): void {
    const data: IFiscalImpactForm = clone(this.state.data);
    this._billApi.getBill(data.LSONumber).then((bill) => {
      this._bill = bill;
      data.BillNumber = bill.BillNumber;
      data.CatchPhrase = bill.CatchTitle;
      data.BillStatus = bill.BillStatus;
      data.BillSponsor = bill.Sponsor;
      data.BillDocumentVersion = bill.DocumentVersion.toString();
      this._setState(data);
    }, (error) => {
      this._setErrorState();
    });
  }

  private _setState(data: IFiscalImpactForm): void {
    this.setState({ ...this.state, data, formValidation: this._validateForm(data) });
  }

  @autobind
  private _saveFiscalImpact(): void {
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

  private _getDate(val: string | Date): Date | undefined {
    if (McsUtil.isString(val)) {
      try {
        return new Date(val.toString());
      } catch (e) {
        return undefined;
      }
    }
    return val as Date;
  }

  private _getPacketTypesOptions(): IChoiceGroupOption[] {
    return [
      {
        key: "No",
        text: "Non Admininstrative And Administrative",
      } as IChoiceGroupOption,
      {
        key: "Yes",
        text: "Administrative Only",
      }];
  }

  private _getCancelRequestOptions(): IChoiceGroupOption[] {
    return [
      {
        key: "No",
        text: "No",
      },
      {
        key: "Yes",
        text: "Yes (request replaces prior requests)",
      }];
  }

  private _getData(token: string): void {
    let lsoNumber: string = "";
    const queryParameters: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
    if (queryParameters.getValue("LSONumber")) {
      lsoNumber = queryParameters.getValue("LSONumber");
    }
    if (McsUtil.isString(lsoNumber)) {
      this._billApi.getBill(lsoNumber).then((bill: IBills) => {
        this._bill = bill;
        const peopleService: PeopleService = new PeopleService();
        const defaultValue: IFiscalImpactForm = this._getDefaultValue(lsoNumber, bill);
        Promise.all([this._service.getItemByLsoNumber(this.props.httpClient, defaultValue.LSONumber, token),
        peopleService.loadCurrentUserProfile(),
        this._service.getFiscalAgencyContact(),
        this._service.getFiscalItemByLsoNumber(FiscalType.FiscalDirective, this.props.httpClient, defaultValue.LSONumber, token),
        ]).then((responses) => {
          const userProfileProperties: any = responses[1];
          defaultValue.PreparedByFirstName = this._getUserPropertyValue(userProfileProperties, "FirstName");
          defaultValue.PreparedByLastName = this._getUserPropertyValue(userProfileProperties, "LastName");
          defaultValue.PreparedByEmail = this._getUserPropertyValue(userProfileProperties, "WorkEmail");
          defaultValue.PreparedByPhone = this._getUserPropertyValue(userProfileProperties, "WorkPhone");
          defaultValue.PreparedByFax = this._getUserPropertyValue(userProfileProperties, "Fax");
          defaultValue.PreparedByTitle = this._getUserPropertyValue(userProfileProperties, "Title");

          const fiscalNoteDirective: IFiscalDirectiveForm = responses[3];
          if (McsUtil.isDefined(fiscalNoteDirective) && McsUtil.isArray(fiscalNoteDirective.FiscalDirectiveAgencies) &&
            fiscalNoteDirective.FiscalDirectiveAgencies.length > 0) {
            this._agencyList = responses[2].filter((a) => {
              // tslint:disable-next-line:prefer-for-of
              for (let i: number = 0; i < fiscalNoteDirective.FiscalDirectiveAgencies.length; i++) {
                const agency: IFiscalDirectiveAgency = fiscalNoteDirective.FiscalDirectiveAgencies[i];
                // tslint:disable-next-line:triple-equals
                if (a.Title == agency.AgencyCode) {
                  return true;
                }
              }
              return false;
            });
          } else {
            this._agencyList = responses[2];
          }

          const fiscalImpact: IFiscalImpactForm = McsUtil.isDefined(responses[0]) ? responses[0] : defaultValue;
          fiscalImpact.Modifiedby = this._getUserPropertyValue(userProfileProperties, "UserName");
          fiscalImpact.ModifiedDate = new Date();
          this.setState({
            ...this.state,
            data: fiscalImpact,
            loading: false,
          });
        }, (err) => {
          this._setErrorState(err);
        });
      }, (error) => { this._setErrorState(error); });
    } else {
      this._setErrorState("LsoNumber is required.");
    }
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

  private _getDefaultValue(lsoNumber: string, bill?: IBills): IFiscalImpactForm {
    return {
      BillId: 0,
      LSONumber: McsUtil.isDefined(bill) ? bill.LSONumber : "",
      BillNumber: McsUtil.isDefined(bill) ? bill.BillNumber : "",
      BillDocumentVersion: McsUtil.isDefined(bill) ? `${bill.DocumentVersion}` : "",
      PreparedByFirstName: "",
      PreparedByLastName: "",
      PreparedByPhone: "",
      PreparedByTitle: "",
      PreparedByEmail: "",
      PreparedByFax: "",
      PreparedByAccount: "",
      CatchPhrase: McsUtil.isDefined(bill) ? bill.CatchTitle : "",
      BillSponsor: McsUtil.isDefined(bill) ? bill.Sponsor : "",
      BillStatus: McsUtil.isDefined(bill) ? bill.BillStatus : "",
      FiscalImpactDueDate: new Date(),
      PacketType: "No",
      CancelPreviousRequests: "No",
      OtherComments: "",
      SendEmail: true,
      AnalystEmail: true,
      Message: "",
      Modifiedby: "",
      ModifiedDate: new Date(),
      FiscalImpactAttachments: [{
        FiscalImpactId: 0,
        FileName: "",
        Extension: "",
      }],
      FiscalImpactAgencyInfoes:
      [{
        FiscalImpactAgencyCCs: [
          {
            FiscalImpactId: 0,
            AgencyInfoId: 0,
            CCContactName: "",
            CCEmailAddr: "",
          },
        ],
        FiscalImpactId: 0,
        AgencyName: "",
        DirectorName: "",
        DirectorEmail: "",
        AgencyCode: "",
      }],
    } as IFiscalImpactForm;
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

  private _handleLabel(value: any): string {
    if (McsUtil.isDefined(value)) {
      return value as string;
    }
    return "-";
  }

  private _handleNumber(value: any): number {
    return McsUtil.isNumberString(value as string) ? parseInt(value as string, 10) : 0;
  }

  // validation part
  private _validateForm(data: IFiscalImpactForm): IFormValidation {
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
