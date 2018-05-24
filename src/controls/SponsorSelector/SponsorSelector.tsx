import * as React from "react";
import styles from "./SponsorSelector.module.scss";
import { Constants, ILegislator, ICommittee, McsUtil } from "mcs-lms-core";
import {
  autobind,
  TextField,
  Dropdown,
  IDropdownOption,
  ChoiceGroup,
  IChoiceGroupOption,
  Label,
} from "office-ui-fabric-react";
import { Loading, Error } from "../Loading/Loading";
import { clone } from "@microsoft/sp-lodash-subset";
import Select from "react-select";
import "../../../node_modules/react-select/dist/react-select.css";
import { ISponsorSelectorProps } from "./ISponsorSelectorProps";
import { ISponsorSelectorState } from "./ISponsorSelectorState";
import { SponsorService } from "../../services/SponsorService";

export default class SponsorSelector extends React.Component<ISponsorSelectorProps, ISponsorSelectorState> {
  private _filteredLegislator: ILegislator[];
  private _filteredCommittees: ICommittee[];
  private _sponsorService: SponsorService;

  constructor(props: ISponsorSelectorProps, context?: any) {
    super(props, context);
    this._sponsorService = new SponsorService(props.isLocalEnvironment);
    this._filteredLegislator = [];
    this._filteredCommittees = [];
    this.state = {
      loading: true,
      loadingError: "",
      validationMessage: "",
      type: props.selectedType || Constants.SponsorType.Legislator,
      otherSponsorValue: "",
      selectedLegislator: undefined,
      selectedCommittee: undefined,
    };
  }

  public componentDidMount(): void {
    this._loadOptions();
    let selectedType: Constants.SponsorType = Constants.SponsorType.Legislator;
    if (McsUtil.isDefined(this.props.selectedType)) {
      if (this.props.selectedType === Constants.SponsorType.Committee) {
        selectedType = Constants.SponsorType.Committee;
      } else if (this.props.allowOther && this.props.selectedType === Constants.SponsorType.Other) {
        selectedType = Constants.SponsorType.Other;
      }
    }
    this.setState({ ...this.state, type: selectedType });
    // if (McsUtil.isDefined(this.props) && McsUtil.isString(this.props.isRequired)) {
    //   if (this.props.isRequired) {
    //     this.setState({
    //       ...this.state,
    //       validationError: {
    //         valid: false,
    //         errorMessage: this.props.errorMessage,
    //       },
    //     });
    //   }
    // }
  }

  public componentDidUpdate(prevProps: ISponsorSelectorProps, prevState: ISponsorSelectorState): void {
    if (prevProps.selectedValue !== this.props.selectedValue || prevProps.selectedType !== this.props.selectedType || prevProps.errorMessage !== this.props.errorMessage) {
      const newType: Constants.SponsorType = this.props.selectedType || Constants.SponsorType.Legislator;
      const newValue: string = this.props.selectedValue;
      if (McsUtil.isString(newValue)) {
        this._getSelectedKeys(newType, newValue).then((value) => {
          if (newType === Constants.SponsorType.Other && newValue !== this.state.otherSponsorValue) {
            this.setState({ type: newType, otherSponsorValue: value as string });
          } else {
            if (newType === Constants.SponsorType.Committee) {
              this.setState({ type: newType, selectedCommittee: value as ICommittee });
            } else {
              this.setState({ type: newType, selectedLegislator: value as ILegislator[] });
            }
          }
        }, (err) => {
          this.setState({
            loading: false,
            loadingError: err,
          });
        });
      } else {
        if (!McsUtil.isString(prevProps.errorMessage) && McsUtil.isString(this.props.errorMessage) && !McsUtil.isString(newValue)) {
          this.setState({ ...this.state, validationMessage: this.props.errorMessage });
        } else {
          if (newType === Constants.SponsorType.Other && newValue !== this.state.otherSponsorValue) {
            this.setState({ type: newType, otherSponsorValue: "" });
          } else {
            if (newType === Constants.SponsorType.Committee) {
              this.setState({ type: newType, selectedCommittee: {} as ICommittee });
            } else {
              this.setState({ type: newType, selectedLegislator: [] });
            }
          }
        }
      }
    }
  }

  public render(): React.ReactElement<ISponsorSelectorProps> {
    const options: IChoiceGroupOption[] = this._getLegislationTypeOptions();
    const { loading, loadingError, type, otherSponsorValue, selectedLegislator, selectedCommittee } = this.state;
    let legislatorKey: number | number[];
    const ismultiselect: boolean = this.props.multiselect || false;
    const displayLegislatorOption1: boolean = !loading && !ismultiselect && (this.state.type === Constants.SponsorType.Legislator);
    const displayLegislatorOption2: boolean = !loading && ismultiselect && (this.state.type === Constants.SponsorType.Legislator);
    const displayCommitteeOptions: boolean = !loading && !ismultiselect && (this.state.type === Constants.SponsorType.Committee);
    const displayOtherOptions: boolean = !loading && this.props.allowOther && !ismultiselect && (this.state.type === Constants.SponsorType.Other);

    if (McsUtil.isArray(selectedLegislator) && selectedLegislator.length > 0) {
      if (ismultiselect) {
        legislatorKey = selectedLegislator.map((l) => l.Id);
      } else {
        legislatorKey = selectedLegislator[0].Id;
      }
    } else {
      if (!ismultiselect) {
        legislatorKey = 0;
      }
    }

    const legislatorOptions: any[] = this._filteredLegislator
      .map((currentValue: ILegislator, index: number): any => {
        return {
          value: currentValue.Id,
          label: currentValue.LegislatureDisplayName,
        };
      });
    const committeeOptions: any[] = this._filteredCommittees.map((currentValue: ICommittee): any => {
      return {
        value: currentValue.Id,
        label: McsUtil.isString(currentValue.CommitteeDisplayTitle) ? currentValue.CommitteeDisplayTitle : currentValue.Title,
      };
    });

    if (!this.props.multiselect) {
      legislatorOptions.unshift({
        value: 0,
        label: "Select a legislator",
      });
      committeeOptions.unshift({
        value: 0,
        label: "Select a committee",
      });
    }

    const disabled: boolean = this.props.disabled || false;

    return (
      <div className={styles.sponsorselector}>
        <div className={styles.row}>
          <div className={styles.column12}>
            <ChoiceGroup label={this.props.label}
              disabled={disabled}
              selectedKey={Constants.SponsorType[this.state.type]}
              className={styles.inlineflex}
              onChanged={this._sponsorTypeChanged}
              options={options}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.column12}>
            <div className={styles.ddcontainer}>
              {loading && <Loading />}
              {!loading && (loadingError !== "") && (<Error message={loadingError} />)}
              {displayLegislatorOption1 && <Select
                options={legislatorOptions}
                value={legislatorKey as number}
                onChange={this._legislatorValueChanged}
                searchable={true}
                placeholder="Select a Legislator"
                className={styles.reactSelect + (McsUtil.isString(this.state.validationMessage) ? " " + styles.error : "")}
              />}
              {displayLegislatorOption2 && <Select
                options={legislatorOptions}
                multi
                value={legislatorKey as number[]}
                onChange={this._legislatorMultiChanged}
                searchable={true}
                placeholder="Select Legislators"
                className={styles.reactSelect}
              />}
              {displayCommitteeOptions && <Select
                options={committeeOptions}
                value={selectedCommittee ? selectedCommittee.Id : 0}
                onChange={this._committeeValueChanged}
                searchable={true}
                placeholder="Select a Committee"
                className={styles.reactSelect + (McsUtil.isString(this.state.validationMessage) ? " " + styles.error : "")}
              />}
              {displayOtherOptions && <TextField value={otherSponsorValue}
                onChanged={this._otherSponsorChanged}
                disabled={disabled}
                required={this.props.isRequired || false}
                className={McsUtil.isString(this.state.validationMessage) ? styles.error : ""}
              />}
              {this.props.isRequired && McsUtil.isString(this.state.validationMessage) &&
                <Label style={{ color: "#a80000" }}>{this.state.validationMessage}</Label>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  @autobind
  private _legislatorValueChanged(selection: any): void {
    let selectedLegislator: ILegislator[] = [];
    if (McsUtil.isDefined(selection)) {
      selectedLegislator = this._filteredLegislator.filter((l) => l.Id === selection.value);
    }
    const selectedValue: string = this._sponsorService.getLegislatorText(selectedLegislator, false);
    this.setState({ selectedLegislator, validationMessage: this._getValidationMessage(McsUtil.isString(selectedValue)) });
    if (McsUtil.isFunction(this.props.onchange)) {
      this.props.onchange(this.state.type, selectedValue, selectedLegislator);
    }
  }

  @autobind
  private _committeeValueChanged(selection: any): void {
    let selectedValue: string = "";
    let selectedCommittee: ICommittee;
    if (!McsUtil.isDefined(selection)) {
      this.setState({ selectedCommittee, validationMessage: this._getValidationMessage(false) });
    } else {
      selectedCommittee = this._filteredCommittees.filter((l) => l.Id === selection.value)[0];
      selectedValue = this._sponsorService.getCommitteeText([selectedCommittee], false);
      this.setState({ selectedCommittee, validationMessage: this._getValidationMessage(McsUtil.isString(selectedValue)) });
    }
    if (McsUtil.isFunction(this.props.onchange)) {
      this.props.onchange(this.state.type, selectedValue, [selectedCommittee]);
    }
  }

  @autobind
  private _legislatorMultiChanged(selections: any): void {
    let selectedLegislator: ILegislator[] = clone(this.state.selectedLegislator);
    if (!McsUtil.isArray(selectedLegislator) || selections.length <= 0) {
      selectedLegislator = [];
    }
    if (selections.length > 0) {
      if (selections.length > selectedLegislator.length) {
        for (const i in this._filteredLegislator) {
          if (this._filteredLegislator[i].Id === selections[selections.length - 1].value) {
            selectedLegislator.push(this._filteredLegislator[i]);
            break;
          }
        }
      } else {
        for (const i in selectedLegislator) {
          if (selections.filter((x) => x.value === selectedLegislator[i]).length <= 0) {
            selectedLegislator = selectedLegislator.splice(parseInt(i, 10), 1);
            break;
          }
        }
      }
    }
    const selectedValue: string = this._sponsorService.getLegislatorText(selectedLegislator, true);
    this.setState({ selectedLegislator, validationMessage: this._getValidationMessage(McsUtil.isString(selectedValue)) });
    if (McsUtil.isFunction(this.props.onchange)) {
      this.props.onchange(this.state.type, selectedValue, selectedLegislator);
    }
  }

  private _getLegislationTypeOptions(): IChoiceGroupOption[] {
    const options: IChoiceGroupOption[] =
      [
        {
          key: "Legislator",
          text: "Legislator",
        } as IChoiceGroupOption,
        {
          key: "Committee",
          text: "Committee",
          disabled: this._isCommitteeDisabled(),
        },
      ];
    if (this.props.allowOther && !this.props.multiselect) {
      options.push({
        key: "Other",
        text: "Other",
      });
    }
    return options;
  }

  private _isCommitteeDisabled(): boolean {
    return this.props.multiselect;
  }

  // private _returnCallBackFunction(selectedValue: string): void {
  //   if (McsUtil.isFunction(this.props.onchange)) {
  //     this.props.onchange(this.state.type, selectedValue);
  //   }
  // }

  private _loadOptions(): void {
    Promise.all([this._sponsorService.getLegislator(), this._sponsorService.getCommittee()])
      .then((result: [ILegislator[], ICommittee[]]) => {
        const legislatorFilter: (value: ILegislator, index?: number, array?: ILegislator[]) => boolean
          = McsUtil.isFunction(this.props.legislatorFilter) ? this.props.legislatorFilter : () => true;
        this._filteredLegislator = result[0].filter(legislatorFilter);
        const committeeFilter: (value: ICommittee, index?: number, array?: ICommittee[]) => boolean
          = McsUtil.isFunction(this.props.committeeFilter) ? this.props.committeeFilter : () => true;
        this._filteredCommittees = result[1].filter(committeeFilter);
        let otherSponsorValue: string = "";
        let selectedLegislator: ILegislator[];
        let selectedCommittee: ICommittee;
        this._getSelectedKeys(this.state.type, this.props.selectedValue)
          .then((value) => {
            if (this.state.type === Constants.SponsorType.Other) {
              otherSponsorValue = value as string;
            } else {
              if (this.state.type === Constants.SponsorType.Committee) {
                selectedCommittee = value as ICommittee;
              } else {
                selectedLegislator = value as ILegislator[];
              }
            }
            this.setState({
              ...this.state,
              loading: false,
              otherSponsorValue,
              selectedLegislator,
              selectedCommittee,
            });
          }, (err) => {
            this.setState({
              ...this.state,
              loading: false,
              loadingError: err,
            });
          });
      }, (err) => {
        this.setState({
          ...this.state,
          loading: false,
          loadingError: err,
        });
      });
  }

  private _getSelectedKeys(selectedType: Constants.SponsorType, selectedValue: string): Promise<ILegislator[] | ICommittee | string> {
    return new Promise<ILegislator[] | ICommittee | string>((resolve, reject) => {
      if (!McsUtil.isDefined(selectedValue)) {
        if (selectedType === Constants.SponsorType.Other) {
          resolve("");
        }
        resolve(undefined);
      } else {
        if (selectedType === Constants.SponsorType.Other) {
          resolve(selectedValue);
        } else {
          if (selectedType === Constants.SponsorType.Committee) {
            if (!this.props.multiselect) {
              this._sponsorService.getSelectedCommittee(selectedValue)
                .then((selectedCommittee: ICommittee) => {
                  if (McsUtil.isDefined(selectedCommittee)) {
                    resolve(selectedCommittee);
                  } else {
                    resolve(undefined);
                  }
                }, (err) => {
                  reject(err);
                });
            }
          } else {
            if (this.props.multiselect) {
              this._sponsorService.getMultipleSelectedLegislators(selectedValue)
                .then((selectedLegislator: ILegislator[]) => {
                  resolve(selectedLegislator);
                }, (err) => {
                  reject(err);
                });
            } else {
              this._sponsorService.getSelectedLegislator(selectedValue)
                .then((selectedLegislator: ILegislator) => {
                  if (McsUtil.isDefined(selectedLegislator)) {
                    resolve([selectedLegislator]);
                  } else {
                    resolve(undefined);
                  }
                }, (err) => {
                  reject(err);
                });
            }
          }
        }
      }
    });
  }

  @autobind
  private _sponsorTypeChanged(option: IChoiceGroupOption,
    evt?: React.FormEvent<HTMLElement | HTMLInputElement>): void {
    const type: Constants.SponsorType = option.key === "Other" ? Constants.SponsorType.Other :
      (option.key === "Committee" ? Constants.SponsorType.Committee : Constants.SponsorType.Legislator);
    const selectedValue: string = type === Constants.SponsorType.Other ? this.state.otherSponsorValue :
      (type === Constants.SponsorType.Committee ? this._sponsorService.getCommitteeText([this.state.selectedCommittee], false) :
        this._sponsorService.getLegislatorText(this.state.selectedLegislator, this.props.multiselect || false));
    this.setState({
      ...this.state,
      type,
      validationMessage: this._getValidationMessage(McsUtil.isString(selectedValue)),
    });
    if (McsUtil.isFunction(this.props.onchange)) {
      if (type === Constants.SponsorType.Other) {
        this.props.onchange(type, this.state.otherSponsorValue);
      }
      if (type === Constants.SponsorType.Committee) {
        this.props.onchange(type, this._sponsorService.getCommitteeText([this.state.selectedCommittee], false), [this.state.selectedCommittee]);
      }
      if (type === Constants.SponsorType.Legislator) {
        this.props.onchange(type, this._sponsorService.getLegislatorText(this.state.selectedLegislator, this.props.multiselect || false), this.state.selectedLegislator);
      }
    }
  }

  @autobind
  private _legislatorChanged(option: IDropdownOption, index?: number): void {
    let selectedValue: string = "";
    if (option.key === 0 || index < 1) {
      this.setState({ selectedLegislator: [], validationMessage: this._getValidationMessage(false) });
    } else {
      const selectedLegislator: ILegislator[] = [this._filteredLegislator[index - 1]];
      selectedValue = this._sponsorService.getLegislatorText(selectedLegislator, false);
      this.setState({ selectedLegislator, validationMessage: this._getValidationMessage(McsUtil.isString(selectedValue)) });
    }
    if (McsUtil.isFunction(this.props.onchange)) {
      this.props.onchange(this.state.type, selectedValue, [this._filteredLegislator[index - 1]]);
    }
  }

  @autobind
  private _legislatorChangedMultiselect(option: IDropdownOption, index?: number): void {
    let selectedLegislator: ILegislator[] = clone(this.state.selectedLegislator);
    if (!McsUtil.isArray(selectedLegislator)) {
      selectedLegislator = [];
    }
    const optionValue: ILegislator = this._filteredLegislator[index];
    if (option.selected) {
      selectedLegislator.push(optionValue);
    } else {
      selectedLegislator = selectedLegislator.filter((v) => v.Id !== optionValue.Id);
    }
    const selectedValue: string = this._sponsorService.getLegislatorText(selectedLegislator, true);
    this.setState({ selectedLegislator, validationMessage: this._getValidationMessage(McsUtil.isString(selectedValue)) });
    if (McsUtil.isFunction(this.props.onchange)) {
      this.props.onchange(this.state.type, selectedValue, selectedLegislator);
    }
  }

  private _getValidationMessage(isvalid: boolean): string {
    if (this.props.isRequired) {
      return isvalid ? "" : (McsUtil.isString(this.props.errorMessage) ? this.props.errorMessage : "Required");
    }
    return "";
  }

  @autobind
  private _committeeChanged(option: IDropdownOption, index?: number): void {
    let selectedValue: string = "";
    if (option.key === 0 || index < 1) {
      this.setState({ selectedCommittee: undefined, validationMessage: this._getValidationMessage(false) });
    } else {
      const selectedCommittee: ICommittee = this._filteredCommittees[index - 1];
      selectedValue = this._sponsorService.getCommitteeText([selectedCommittee], false);
      this.setState({ selectedCommittee, validationMessage: this._getValidationMessage(McsUtil.isString(selectedValue)) });
    }
    if (McsUtil.isFunction(this.props.onchange)) {
      this.props.onchange(this.state.type, selectedValue, [this._filteredCommittees[index - 1]]);
    }
  }

  @autobind
  private _otherSponsorChanged(newValue: any): void {
    this.setState({ otherSponsorValue: newValue, validationMessage: this._getValidationMessage(McsUtil.isString(newValue)) });
    if (McsUtil.isFunction(this.props.onchange)) {
      this.props.onchange(Constants.SponsorType.Other, newValue);
    }
  }
}