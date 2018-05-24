import * as React from "react";
import styles from "./AmendmentForm.module.scss";
import { IAmendmentFormProps } from "./IAmendmentFormProps";
import { escape, clone } from "@microsoft/sp-lodash-subset";
import { IAmendmentFormState, IAmendmentFormData } from "./IAmendmentFormState";
import {
  IBills, IAmendments, ILegislator, ICommittee, IAmendmentEntity, EventEmitter,
  IUser, McsUtil, Constants, tokenProvider,
} from "mcs-lms-core";
import { BillsService } from "../../../services/BillsService";
import { AmendmentService } from "../../../services/AmendmentService";
import { SponsorService } from "../../../services/SponsorService";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import { Loading, Error } from "../../../controls/Loading/Loading";
import {
  autobind,
  IPersonaProps,
  Label,
  Checkbox,
  Dropdown,
  IDropdownOption,
  Link,
  TextField,
  PrimaryButton,
  CommandBarButton,
} from "office-ui-fabric-react";
import SponsorSelector from "../../../controls/SponsorSelector/SponsorSelector";
import LmsPeoplePicker from "../../../controls/PeoplePicker/LmsPeoplePicker";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import { SiteUserProps } from "sp-pnp-js";
import { PeopleService } from "../../../services/PeopleService";
import SpinnerControl from "../../../controls/Loading/SpinnerControl";
import JccReport from "./JccReport/JccReport";

export default class AmendmentForm extends React.Component<IAmendmentFormProps, IAmendmentFormState> {
  private _openJccDialog: boolean;
  private readonly _eventEmitter: EventEmitter = EventEmitter.getInstance();
  private _billService: BillsService;
  private _amendmentService: AmendmentService;
  private _amendmentInit: IAmendments;
  private _amendmentFormData: IAmendmentFormData;
  private readonly _billRequiredMessage: string = "Bill is required.";
  private _sponsorService: SponsorService;
  private _currentUserPersona: IPersonaProps;
  private _currentUser: IUser;
  private _spinner: SpinnerControl;
  private _billIsEngrossed: boolean;

  constructor(props: IAmendmentFormProps, context?: any) {
    super(props);
    this._billService = new BillsService(this.props.isLocalEnvironment);
    this._amendmentService = new AmendmentService(this.props.isLocalEnvironment);
    this._sponsorService = new SponsorService(this.props.isLocalEnvironment);
    this._billIsEngrossed = false;
    this.state = {
      loading: false,
      bill: null,
      error: "Bill is required.",
      amendment: this._getDefaultAmendment(),
      signedIn: false,
      type: null,
      selectedSplitCount: 0,
      selectedReading: "",
      selectedResurrectAmendment: 0,
      offeredNumber: "",
      resurrectAmendments: [],
      openJccModal: false,
    };
    this._loadCurrentUser();
  }

  public componentDidMount(): void {
    this._getData();
  }

  public render(): React.ReactElement<IAmendmentFormProps> {
    const { title, isLocalEnvironment, spHttpClient, ...otherProps } = this.props;
    const { amendment } = this.state;
    return (
      <div className={styles.amendmentForm}>
        <div className={styles.container}>
          <WebpartHeader webpartTitle={title} />
          {this.state.loading && (<Loading />)}
          {!this.state.loading && (this.state.error !== "") && (<Error message={this.state.error} />)}
          {!this.state.loading && McsUtil.isDefined(this.state.bill) && (this.state.error === "") && (<div className={styles.content}>
            <div className={styles.row}>
              <div className={styles.column6}>
                <CommandBarButton className={styles.buttonlink} data-automation-id="newAmendment"
                  iconProps={{ iconName: "Add" }} text="New Amendment" onClick={this._createNewAmendment} />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.column6}>
                <Label className={styles.header}>Bill Number: </Label><Link className={styles.description} href="">{this.state.bill.BillNumber}</Link>
              </div>
              <div className={styles.column6}>
                <Label className={styles.header}>Catch Title: </Label><Label className={styles.description}>{this.state.bill.CatchTitle}</Label>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.column6}>
                <TextField label="Amendment No" value={amendment.AmendmentNumber} readOnly={true} />
              </div>
              <div className={styles.column6}>
                <TextField label="Amendment Status" value={amendment.AmendmentStatus} readOnly={true} />
              </div>
            </div>
            {this._isProposed(amendment.AmendmentStatus) &&
              <div className={styles.row}>
                <div className={styles.column6}>
                  <Dropdown label="Reading" selectedKey={this.state.selectedReading} onChanged={this._readingChanged} options={this._getReadingOptions()} />
                </div>
                <div className={styles.column6}>
                  <TextField label="Offered Number" readOnly={true} value={this.state.offeredNumber} />
                </div>
              </div>
            }
            <div className={styles.row}>
              {this.state.type === null &&
                <div className={styles.column6}>
                  <Dropdown label="Use like during create"
                    disabled={!this._isNewAmendment()}
                    selectedKey={this.state.selectedResurrectAmendment}
                    options={this.state.resurrectAmendments}
                    onChanged={this._useLikeDuringCreateChanged} />
                </div>
              }
              {this._isApprovedForDistribution(amendment.AmendmentStatus) && <section className={styles.split}>
                <div className={styles.column4}>
                  <Dropdown label="Split Amendment" onChanged={this._splitAmendmentSelected}
                    selectedKey={this.state.selectedSplitCount} options={this._getSplitAmendmentOptions()} />
                </div>
                <div className={styles.column2}>
                  <PrimaryButton className={styles.split} disabled={this.state.selectedSplitCount < 1} text="Split" onClick={this._splitAmendment} />
                </div>
              </section>
              }
            </div>
            {McsUtil.isString(amendment.AmendmentStatus) &&
              <div className={styles.row}>
                <div className={styles.column3}>
                  <Checkbox label="To Engrossed copy " onChange={this._engrossedCopyChanged} checked={amendment.AppliedToEngrossed} />
                </div>
                <div className={styles.column3}>
                  <Checkbox label="Is Corrected copy? " disabled={this._amendmentInit.IsCorrectedCopy}
                    onChange={this._correctedCopyChanged} checked={amendment.IsCorrectedCopy} />
                </div>
                <div className={styles.column6}>
                  <Checkbox label="Is Corrected to Corrected copy? " disabled={!this._amendmentInit.IsCorrectedCopy}
                    onChange={this._correctedToCorrectedChanged} checked={amendment.IsCorrectedToCorrectedCopy} />
                </div>
              </div>
            }
            <div className={styles.row}>
              <div className={styles.column6 + " " + styles.nopadding}>
                <SponsorSelector
                  isLocalEnvironment={isLocalEnvironment}
                  allowOther={false}
                  label="Sponsor"
                  multiselect={false}
                  selectedType={Constants.SponsorType[amendment.SponsorType]}
                  selectedValue={amendment.Sponsor}
                  isRequired={true}
                  errorMessage="Sponsor cannot be empty."
                  onchange={this._sponsorSelected}
                />
              </div>
              <div className={styles.column6 + " " + styles.nopadding}>
                <SponsorSelector
                  isLocalEnvironment={this.props.isLocalEnvironment}
                  allowOther={false}
                  label="Requestor"
                  isRequired={false}
                  multiselect={false}
                  selectedType={Constants.SponsorType[amendment.RequestorType]}
                  selectedValue={amendment.Requestor}
                  onchange={this._requestorSelected}
                />
              </div>
            </div>
            {this._isNumbered(amendment.AmendmentStatus) &&
              <div className={styles.row}>
                <div className={styles.column6 + "" + styles.nopadding}>
                  <div className={styles.row}>
                    <SponsorSelector
                      isLocalEnvironment={this.props.isLocalEnvironment}
                      allowOther={true}
                      label="CoSponsor"
                      isRequired={false}
                      multiselect={true}
                      errorMessage=""
                      selectedType={Constants.SponsorType.Legislator}
                      selectedValue={amendment.CoSponsor}
                      onchange={this._coSponsorSelected}
                    />
                  </div>
                </div>
              </div>
            }
            <div className={styles.row}>
              <div className={styles.column6 + " " + styles.nopadding}>
                <LmsPeoplePicker
                  selectedUser={this._getDrafter()}
                  label="Drafter"
                  spHttpClient={spHttpClient}
                  principalTypeUser={true}
                  principalTypeSharePointGroup={false}
                  principalTypeDistributionList={false}
                  principalTypeSecurityGroup={false}
                  isLocalEnvironment={isLocalEnvironment}
                  onchange={this._drafterSelected}
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.column12}>
                {this._getButtons()}
              </div>
            </div>
            <JccReport onDismiss={this._onJccModalDismiss}
              showJccForm={this.state.openJccModal}
              bill={this.state.bill}
              isLocalEnvironment={this.props.isLocalEnvironment} />
            <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
          </div>
          )}
        </div>
      </div>
    );
  }

  public componentDidUpdate(prevProps: IAmendmentFormProps, prevState: IAmendmentFormState, prevContext: any): void {
    if (prevState.signedIn !== this.state.signedIn && !McsUtil.isDefined(this.state.hasToken)) {
      tokenProvider.isSignedIn().then((signedIn) => {
        this.setState({ ...this.state, hasToken: signedIn });
      }, (err) => {
        this.setState({ ...this.state, hasToken: false });
      });
    }
  }

  private _getButtons(): JSX.Element {
    return <div>
      {!McsUtil.isDefined(this.state.amendment.Id) &&
        <PrimaryButton text="Create" onClick={this._createAmendment} className={styles.button} disabled={!this._canCreateAmendment()} />}
      {McsUtil.isDefined(this.state.amendment.Id) &&
        <PrimaryButton text="Save" onClick={this._saveAmendment} className={styles.button} disabled={!this._canSaveAmendment()} />}
      {this._isProposed(this.state.amendment.AmendmentStatus) &&
        <PrimaryButton text="Number Amendment" className={styles.button} onClick={this._createNumberedAmendment} disabled={!this._canCreateNumbered()} />
      }
      {this._isNumbered(this.state.amendment.AmendmentStatus) &&
        <PrimaryButton text="Approve For Distribution" className={styles.button} onClick={this._approveAmendment} />
      }
      <PrimaryButton text="Create JCC Report" className={styles.button} onClick={this._createReport} />
    </div>;
  }

  private _isProposed(status: string): boolean {
    return status === AmendmentService.proposedStatus;
  }

  private _isNumbered(status: string): boolean {
    return status === AmendmentService.numberedStatus;
  }

  private _isApprovedForDistribution(status: string): boolean {
    return status === AmendmentService.approvedForDistributionStatus;
  }

  private _canCreateAmendment(): boolean {
    // drafter is required too.
    return McsUtil.isString(this.state.amendment.AmendmentNumber) && McsUtil.isString(this.state.amendment.Sponsor);
  }

  private _canSaveAmendment(): boolean {
    if (McsUtil.isString(this._amendmentInit.AmendmentNumber) && McsUtil.isString(this.state.offeredNumber)) {
      return (this._amendmentInit.AmendmentNumber === this.state.offeredNumber) && McsUtil.isString(this.state.amendment.Sponsor);
    }
    return McsUtil.isString(this.state.amendment.AmendmentNumber) && McsUtil.isString(this.state.amendment.Sponsor);
  }

  private _canCreateNumbered(): boolean {
    return McsUtil.isString(this.state.offeredNumber);
  }

  private _getDefaultAmendment(): IAmendments {
    this._amendmentFormData = {} as IAmendmentFormData;
    this._amendmentFormData.DrafterToPersona = this._currentUserPersona;
    const defaultAmendment: IAmendments = {
      AmendmentNumber: "",
      AmendmentStatus: "",
    } as IAmendments;
    defaultAmendment.Drafter = this._currentUser;
    defaultAmendment.DrafterId = McsUtil.isDefined(this._currentUser) ? this._currentUser.Id : null;
    defaultAmendment.AppliedToEngrossed = this._billIsEngrossed;
    return defaultAmendment;
  }

  @autobind
  private _createNewAmendment(): void {
    this.setState({ ...clone(this.state), amendment: this._getDefaultAmendment() });
  }

  @autobind
  private _getSplitAmendmentOptions(): IDropdownOption[] {
    let i: number = 0;
    const options: IDropdownOption[] = [{ key: i, text: "Select # of Split" }];
    while (i < 99) {
      i++;
      options.push({ key: i, text: i.toString() });
    }
    return options;
  }

  @autobind
  private _getDrafter(): IPersonaProps[] {
    if (this._amendmentFormData.DrafterToPersona) {
      return [this._amendmentFormData.DrafterToPersona];
    }
    return [];
  }

  @autobind
  private _drafterSelected(users: SiteUserProps[], items: IPersonaProps[]): void {
    let newUser: any = null;
    let newPersona: IPersonaProps = null;
    if (users.length > 0) {
      newUser = { Id: users[0].Id, EMail: users[0].Email, Title: users[0].Title };
      newPersona = items[0];
    }
    this._amendmentFormData.DrafterToPersona = newPersona;
    const amendmentObj: IAmendments = clone(this.state.amendment);
    if (McsUtil.isArray(users) && users.length > 0) {
      amendmentObj.DrafterId = users[0].Id;
    } else {
      amendmentObj.DrafterId = null;
    }
    this.setState({
      ...this.state,
      amendment: amendmentObj,
    });
  }

  @autobind
  private _engrossedCopyChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
    const amendmentClone: IAmendments = clone(this.state.amendment);
    amendmentClone.AppliedToEngrossed = checked;
    this.setState({ ...(clone(this.state)), amendment: amendmentClone });
  }

  @autobind
  private _correctedCopyChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
    const amendmentClone: IAmendments = clone(this.state.amendment);
    amendmentClone.IsCorrectedCopy = checked;
    this.setState({ ...(clone(this.state)), amendment: amendmentClone });
  }

  @autobind
  private _correctedToCorrectedChanged(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void {
    const amendmentClone: IAmendments = clone(this.state.amendment);
    amendmentClone.IsCorrectedToCorrectedCopy = checked;
    this.setState({ ...(clone(this.state)), amendment: amendmentClone });
  }

  @autobind
  private _getReadingOptions(): IDropdownOption[] {
    return [{ key: "", text: "Select Reading" },
    { key: "S", text: "Standing Committee" },
    { key: "W", text: "Committee of whole" },
    { key: "2", text: "Second reading" },
    { key: "3", text: "Third reading" },
    { key: "JC", text: "Joint Conference Committee" },
    ];
  }

  @autobind
  private _isNewAmendment(): boolean {
    const status: string = this.state.amendment.AmendmentStatus;
    return !McsUtil.isString(status);
  }

  @autobind
  private _useLikeDuringCreateChanged(option: IDropdownOption, index?: number): void {
    this.setState({
      ...(clone(this.state)),
      selectedResurrectAmendment: option.key as number,
    });
  }

  @autobind
  private _readingChanged(option: IDropdownOption, index?: number): void {
    const selectedReading: string = option.key.toString();
    if (index > 0) {
      this._amendmentService.getAmendmentNumber(this.state.bill, this._getHouse(), selectedReading).then((offeredNumber) => {
        this.setState({
          ...(clone(this.state)),
          offeredNumber,
          selectedReading,
        });
      }, (err) => {
        this.setState({ ...(clone(this.state)), error: err });
      });
    } else {
      this.setState({
        ...(clone(this.state)),
        offeredNumber: "",
        selectedReading,
      });
    }
  }

  @autobind
  private _sponsorSelected(type: Constants.SponsorType, selected: any): void {
    const amendmentClone: IAmendments = clone(this.state.amendment);
    amendmentClone.SponsorType = Constants.SponsorType[type];
    amendmentClone.Sponsor = selected;
    if (!McsUtil.isUnsignedInt(amendmentClone.Id)) {
      this._setAmendmentNumber(type, selected);
    }
    this.setState({ ...(clone(this.state)), amendment: amendmentClone });
  }

  @autobind
  private _requestorSelected(type: Constants.SponsorType, selected: any): void {
    const amendmentClone: IAmendments = clone(this.state.amendment);
    amendmentClone.RequestorType = Constants.SponsorType[type];
    amendmentClone.Requestor = selected;
    this.setState({ ...(clone(this.state)), amendment: amendmentClone });
  }

  @autobind
  private _coSponsorSelected(type: Constants.SponsorType, selected: any): void {
    const amendment: IAmendments = clone(this.state.amendment);
    amendment.CoSponsor = selected;
    this.setState({
      ...this.state,
      amendment,
    });
  }

  @autobind
  private _splitAmendmentSelected(option: IDropdownOption, index?: number): void {
    const splitCount: number = parseInt(option.key.toString(), 10);
    this.setState({
      ...(clone(this.state)),
      selectedSplitCount: splitCount,
    });
  }

  @autobind
  private _splitAmendment(): void {
    tokenProvider.getToken().then((token: string) => {
      this._spinner.setVisibility(true);
      this._amendmentService.splitAmendment(this.props.httpClient,
        this.state.amendment, this.state.selectedSplitCount, token).then((amendments) => {
          this._spinner.setVisibility(false);
          this._eventEmitter.emit("RefreshListView", { Items: amendments });
          this._amendmentInit = this._getDefaultAmendment();
          this.setState({ ...this.state, amendment: this._amendmentInit });
        }, (err) => {
          this._spinner.setVisibility(false);
          this.setState({ ...this.state, error: err });
        });
    }, (err) => {
      this.setState({ ...this.state, error: err });
    });
  }

  @autobind
  private _setAmendmentNumber(type: Constants.SponsorType, sponsor: any): void {
    this._amendmentService.getProposedAmendmentNumber(this.state.bill, type, sponsor).then((result: string) => {
      const amendmentObj: IAmendments = clone(this.state.amendment);
      amendmentObj.AmendmentNumber = amendmentObj.ProposedAmendmentNumber = result;
      this.setState({
        ...clone(this.state),
        amendment: amendmentObj,
      });
    });
  }

  @autobind
  private _createAmendment(): void {
    tokenProvider.getToken().then((token: string) => {
      this._spinner.setVisibility(true);
      const isCommitteeAmendment: boolean = this.state.amendment.SponsorType === Constants.SponsorType[Constants.SponsorType.Committee];
      const isHouseAmendment: boolean = this._getHouse() === "H";
      const amendment: IAmendments = clone(this.state.amendment);
      if (!McsUtil.isString(amendment.Requestor)) {
        amendment.Requestor = amendment.Sponsor;
        amendment.RequestorType = amendment.SponsorType;
      }
      amendment.BillLookupId = this.state.bill.Id;

      this._getResurrectAmendmentUrl().then((resurrectFile) => {
        this._amendmentService.createAmendment(this.props.httpClient, amendment, isHouseAmendment,
          isCommitteeAmendment, this.state.amendment.AppliedToEngrossed, parseInt(this.state.bill.BillNumber, 10),
          resurrectFile.url, resurrectFile.isnumbered, token)
          .then((createdAmendment) => {
            this._eventEmitter.emit("RefreshListView", { Items: createdAmendment });
            this._amendmentInit = createdAmendment;
            this._spinner.setVisibility(false);
            this.setState({
              ...this.state,
              amendment: createdAmendment,
            });
          }, (err) => {
            this._spinner.setVisibility(false);
            this.setState({ ...this.state, error: err });
          });
      }, (err) => {
        this._spinner.setVisibility(false);
        this.setState({ ...this.state, error: err });
      });
    });
  }

  private _getResurrectAmendmentUrl(): Promise<{ url: string, isnumbered: boolean }> {
    return new Promise<{ url: string, isnumbered: boolean }>((resolve, reject) => {
      if (this.state.selectedResurrectAmendment > 0) {
        this._amendmentService.getAmendmentById(this.state.selectedResurrectAmendment)
          .then((amendmentToResurrect: IAmendments) => {
            if (amendmentToResurrect != null) {
              resolve({ url: amendmentToResurrect.File.ServerRelativeUrl, isnumbered: /proposed/gi.test(amendmentToResurrect.AmendmentNumber) });
            } else {
              resolve({ url: "", isnumbered: false });
            }
          }, (err) => { resolve({ url: "", isnumbered: false }); });
      } else {
        resolve({ url: "", isnumbered: false });
      }
    });
  }

  @autobind
  private _saveAmendment(): void {
    this._spinner.setVisibility(true);
    tokenProvider.getToken().then((token: string) => {
      const newProperties: IAmendments = clone(this.state.amendment);
      if (McsUtil.isString(this.state.offeredNumber)) {
        newProperties.AmendmentNumber = clone(this.state.offeredNumber);
      }
      this._amendmentService.saveAmendment(this.props.httpClient, this._amendmentInit, newProperties, token).then((savedAmendment) => {
        this._eventEmitter.emit("RefreshListView", { Items: savedAmendment });
        this._spinner.setVisibility(false);
        this._amendmentInit = savedAmendment;
        this.setState({
          ...this.state,
          amendment: savedAmendment,
        });
      }, (err) => {
        this._spinner.setVisibility(false);
        this.setState({ ...this.state, error: err });
      });
    }, (err) => {
      this._spinner.setVisibility(false);
      this.setState({ ...this.state, error: err });
    });
  }

  @autobind
  private _createNumberedAmendment(): void {
    this._spinner.setVisibility(true);
    tokenProvider.getToken().then((token: string) => {
      const newProperties: IAmendments = clone(this.state.amendment);
      if (McsUtil.isString(this.state.offeredNumber)) {
        newProperties.AmendmentNumber = clone(this.state.offeredNumber);
      }
      this._amendmentService.createNumberedAmendment(this.props.httpClient,
        this._amendmentInit, newProperties, this.state.bill, this._getHouse(), this.state.selectedReading, token).then((result) => {
          this._eventEmitter.emit("RefreshListView", { Items: result });
          this._amendmentInit = result;
          this._spinner.setVisibility(false);
          this.setState({
            ...this.state,
            amendment: result,
          });
        }, (err) => {
          this._spinner.setVisibility(false);
          this.setState({ ...this.state, error: err });
        });
    }, (err) => {
      this._spinner.setVisibility(false);
      this.setState({ ...this.state, error: err });
    });
  }

  @autobind
  private _approveAmendment(): void {
    this._spinner.setVisibility(true);
    this._amendmentService.approveForDistribution(this.state.amendment).then((result) => {
      this._eventEmitter.emit("RefreshListView", { Items: result });
      this._amendmentInit = result;
      this._spinner.setVisibility(false);
      this.setState({ ...this.state, amendment: this._amendmentInit });
    }, (err) => {
      this._spinner.setVisibility(false);
      this.setState({ ...this.state, error: err });
    });
  }

  @autobind
  private _createReport(): void {
    this.setState({ ...this.state, openJccModal: true });
  }

  private _getData(): void {
    this._eventEmitter.on("Bill", this._receiveBill.bind(this));
    this._eventEmitter.on("Amendment", this._receiveAmendment.bind(this));
    this._loadResurrectAmendments();
  }

  private _loadResurrectAmendments(): void {
    const options: IDropdownOption[] = [];
    options.push({
      key: "",
      text: "Select an Amendment",
    });
    this._amendmentService.getResurrectAmendments()
      .then((amendmentList) => {
        amendmentList.forEach((amendment: IAmendments) => {
          options.push({
            key: amendment.Id,
            text: amendment.AmendmentNumber,
          });
        });
        this.setState({
          ...clone(this.state),
          resurrectAmendments: options,
        });
      });
  }

  private _receiveBill(value: any): void {
    if (McsUtil.isDefined(value) && McsUtil.isDefined(value.Items)) {
      const amendment: IAmendments = this._getDefaultAmendment();
      const bill: IBills = value.Items;
      this._amendmentService.isBillEngrossed(bill).then((billEngrossed: boolean) => {
        this._billIsEngrossed = billEngrossed;
        this.setState({
          ...clone(this.state),
          loading: false,
          amendment,
          error: "",
          bill,
        });
      });
    } else {
      this.setState({
        ...this.state,
        loading: false,
        error: this._billRequiredMessage,
      });
    }
  }

  private _receiveAmendment(value: any): void {
    if (McsUtil.isDefined(value) && McsUtil.isArray(value.Items) && value.Items.length > 0 && this.state.amendment.Id !== value.Items[0].Id) {
      this._amendmentService.getAmendmentById(value.Items[0].Id).then((result: IAmendments) => {
        this._amendmentInit = result;
        this.setState({
          ...this.state,
          amendment: result,
        });
      }, (err) => {
        this.setState({ ...this.state, error: err });
      });
    }
  }

  private _loadCurrentUser(): void {
    const peopleService: PeopleService = new PeopleService();
    peopleService.loadCurrentUser().then((value) => {
      this._currentUserPersona = peopleService.getPersonaPropForUser(value);
      this._currentUser = { Title: value.Title, Id: value.Id, EMail: value.Email };
      if (this.state.amendment && !McsUtil.isDefined(this.state.amendment.Id)) {
        let tempAmendment: IAmendments = clone(this.state.amendment);
        tempAmendment = { ...tempAmendment, Drafter: this._currentUser, DrafterId: value.Id };
        this._amendmentFormData.DrafterToPersona = this._currentUserPersona;
        this.setState({ ...this.state, amendment: tempAmendment });
      }
    });
  }

  private _getHouse(): string {
    if (this.state.amendment.SponsorType === Constants.SponsorType[Constants.SponsorType.Legislator]
      && /^Senator/gi.test(this.state.amendment.Sponsor)) {
      return "H";
    } else if (this.state.amendment.SponsorType === Constants.SponsorType[Constants.SponsorType.Committee]
      && /^(H)/gi.test(this.state.amendment.Sponsor)) {
      return "H";
    }
    return "S";
  }

  private _onJccModalDismiss(houseOfOriginAdoptedAmendment: IAmendmentEntity[], oppositeChamberAdoptedAmendment: IAmendmentEntity[]): void {
    this.setState({ ...this.state, openJccModal: false });
    if (houseOfOriginAdoptedAmendment === null && oppositeChamberAdoptedAmendment === null) {
      return;
    }
    this._spinner.setVisibility(true);
    tokenProvider.getToken().then((token: string) => {
      this._amendmentService.createJccAmendment(this.props.httpClient, this.state.bill, this._currentUser.Id,
        houseOfOriginAdoptedAmendment, oppositeChamberAdoptedAmendment, token).then((amendments) => {
          this._spinner.setVisibility(false);
          this._eventEmitter.emit("RefreshListView", { Items: amendments });
          this._amendmentInit = this._getDefaultAmendment();
          this.setState({ ...this.state, amendment: this._amendmentInit });
        }, (err) => {
          this._spinner.setVisibility(false);
          this.setState({ ...this.state, error: err });
        });
    }, (err) => {
      this.setState({ ...this.state, error: err });
    });
  }
}