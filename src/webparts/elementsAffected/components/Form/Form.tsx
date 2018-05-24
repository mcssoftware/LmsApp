import * as React from "react";
import styles from "./Form.module.scss";
import { IFormProps } from "./IFormProps";
import { escape } from "@microsoft/sp-lodash-subset";
import { IFormState, IElement } from "./IFormState";
import { McsUtil, tokenProvider } from "mcs-lms-core";
import { ElementsAffectedService } from "../../../../services/ElementsAffectedService";
import {
  autobind,
  Dropdown, IDropdownOption,
  Toggle,
  Label,
  Link,
  TextField,
  DefaultButton,
  ChoiceGroup,
  PrimaryButton,
} from "office-ui-fabric-react";
import SpinnerControl from "../../../../controls/Loading/SpinnerControl";

export default class Form extends React.Component<IFormProps, IFormState> {
  private _elementsAffectedService: ElementsAffectedService;
  private _spinner: SpinnerControl;

  constructor(props: IFormProps, context: any) {
    super(props, context);
    this._elementsAffectedService = new ElementsAffectedService(this.props.isLocalEnvironment);
    this.state = {
      element: { value: "", disabled: false },
      elementAs: { value: "", disabled: true },
      elementThrough: { value: "", disabled: true },
      elementThroughAs: { value: "", disabled: true },
      rangeType: "",
      isIntro: false,
      elementType: "Amend",
      validation: this._getInitialValidation(),
    };
  }

  public render(): React.ReactElement<IFormProps> {
    const { validation } = this.state;
    // tslint:disable-next-line:max-line-length
    const url: string = `${this.props.webAbsoluteUrl}/_layouts/15/WopiFrame.aspx?sourcedoc={${this.props.bill.File.UniqueId}}&file=${this.props.bill.File.ServerRelativeUrl}&action=default`;
    return (
      <div className={styles.form}>
        <div className={styles.row + " " + styles.flex}>
          <div className={styles.column6 + " " + styles.flex}>
            <div className={styles.column3 + " " + styles.labelMargin}>
              <Label>Document</Label>
            </div>
            <div className={styles.column3 + " " + styles.documentLink}>
              <Link href={url}>{this.props.bill.LSONumber}</Link>
            </div>
          </div>
          <div className={styles.column1 + " " + styles.label}> Type </div>
          <div className={styles.column3}>
            <Dropdown ariaLabel="Element range type"
              className={styles.elementmargin}
              selectedKey={this.state.elementType}
              onChanged={this._onElementTypeChanged}
              options={
                [
                  { key: "Amend", text: "Amend" },
                  { key: "Amend and Renumber", text: "Amend and Renumber" },
                  { key: "Create", text: "Create" },
                  { key: "Renumber", text: "Renumber" },
                  { key: "Repeal", text: "Repeal" },
                  { key: "Repeal & Recreate", text: "Repeal & Recreate" },
                ]
              }
            />
          </div>
        </div>
        <div className={styles.row + " " + styles.flex}>
          <div className={styles.column1 + " " + styles.label}> Element </div>
          <div className={styles.column3}>
            <TextField label=""
              value={this.state.element.value}
              required={!this.state.element.disabled}
              disabled={this.state.element.disabled}
              onChanged={this._elementChanged}
              errorMessage={validation.element.Message} />
          </div>
          <div className={styles.column2 + " " + styles.flex}>
            <Toggle defaultChecked={this.state.isIntro}
              onChanged={this._onIntroChanged}
              label="Intro"
              onText=""
              offText="" />
          </div>
          <div className={styles.column1 + " " + styles.label}> Element </div>
          <div className={styles.column3}>
            <TextField label=""
              value={this.state.elementAs.value}
              required={!this.state.elementAs.disabled}
              disabled={this.state.elementAs.disabled}
              onChanged={this._elementAsChanged}
              errorMessage={validation.elementAs.Message} />
          </div>
        </div>
        <div className={styles.row + " " + styles.flex}>
          <div className={styles.column1 + " " + styles.label}> Element </div>
          <div className={styles.column3}>
            <TextField label=""
              value={this.state.elementThrough.value}
              required={!this.state.elementThrough.disabled}
              disabled={this.state.elementThrough.disabled}
              onChanged={this._elementThroughChanged}
              errorMessage={validation.elementThrough.Message} />
          </div>
          <div className={styles.column2}>
            <Dropdown ariaLabel="Element range type"
              selectedKey={this.state.rangeType}
              onChanged={this._onRangeTypeChanged}
              options={
                [
                  { key: "", text: "" },
                  { key: "And", text: "And" },
                  { key: "Through", text: "Through" },
                ]
              }
            />
          </div>
          <div className={styles.column1 + " " + styles.label}> Element </div>
          <div className={styles.column3}>
            <TextField label=""
              value={this.state.elementThroughAs.value}
              required={!this.state.elementThroughAs.disabled}
              disabled={this.state.elementThroughAs.disabled}
              onChanged={this._elementThroughAsChanged}
              errorMessage={validation.elementThroughAs.Message} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.column12}>
            <PrimaryButton
              disabled={this._addButtonValid()}
              text="Add"
              onClick={this._addButtonClicked}
            />
            <DefaultButton
              text="Clear"
              onClick={this._clearButtonClicked}
            />
          </div>
        </div>
        <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
      </div >
    );
  }

  @autobind
  private _addButtonValid(): boolean {
    const { element, elementAs, elementThrough, elementThroughAs } = this.state;
    const isValid: boolean = McsUtil.isString(element.value) &&
      (!elementAs.disabled || McsUtil.isString(elementAs.value)) &&
      (!elementThrough.disabled || McsUtil.isString(elementThrough.value)) &&
      (!elementThroughAs.disabled || McsUtil.isString(elementThroughAs.value));
    return isValid;
  }

  @autobind
  private _addButtonClicked(): void {
    const { validation } = this.state;
    // tslint:disable:no-string-literal
    const formValid: boolean = true; // validation["element"].isValid;
    const tempElement: string = this.state.element.value;
    const tempElementAs: string = this.state.elementAs.disabled ? "" : this.state.elementAs.value;
    const tempElementThrough: string = this.state.elementThrough.disabled ? "" : this.state.elementThrough.value;
    const tempElementThroughAs: string = this.state.elementThroughAs.disabled ? "" : this.state.elementThroughAs.value;
    const tempRange: string = McsUtil.isString(this.state.rangeType) ? this.state.rangeType : "And";

    // for (const prop in validation) {
    //   if (!validation[prop].isValid && !this.state[prop].disabled) {
    //     formValid = false;
    //     break;
    //   }
    // }
    if (formValid) {
      if (McsUtil.isFunction(this.props.onElementsAddClicked)) {
        this._spinner.setVisibility(true);
        tokenProvider.getToken().then((token) => {
          this._elementsAffectedService.getItemsToInsert(this.props.httpClient, token, parseInt(this.props.bill.BillYear, 10),
            this.props.bill.Id, this.props.bill.LSONumber, this.state.elementType,
            tempElement, tempElementAs, tempElementThrough, tempElementThroughAs, this.state.isIntro, tempRange)
            .then((value) => {
              if (value.HasError) {
                alert(value.Message);
              } else {
                this.props.onElementsAddClicked(value.StatuteCollection)
                  .then(() => {
                    this._spinner.setVisibility(false);
                    const clearState: IFormState = {
                      element: { value: "", disabled: false },
                      elementAs: { value: "", disabled: this.state.elementAs.disabled },
                      elementThrough: { value: "", disabled: this.state.elementThrough.disabled },
                      elementThroughAs: { value: "", disabled: this.state.elementThroughAs.disabled },
                      rangeType: this.state.rangeType,
                      isIntro: false,
                      elementType: this.state.elementType,
                      validation: this._getInitialValidation(),
                    };
                    this.setState(clearState);
                  });
              }
            }, (err) => {
              this._spinner.setVisibility(false);
              alert("Internal server error please contact administrator.");
            });
        }, (err) => {
          this._spinner.setVisibility(false);
          alert(err);
        });
      }
    }
  }

  @autobind
  private _clearButtonClicked(): void {
    const clearState: IFormState = {
      element: { value: "", disabled: false },
      elementAs: { value: "", disabled: true },
      elementThrough: { value: "", disabled: true },
      elementThroughAs: { value: "", disabled: true },
      rangeType: "",
      isIntro: false,
      elementType: this.state.elementType,
      validation: this._getInitialValidation(),
    };
    this.setState(clearState);
  }

  @autobind
  private _onIntroChanged(checked: boolean): void {
    this.setState({ ...this.state, isIntro: checked });
  }

  @autobind
  private _elementChanged(newValue: any): void {
    const { element } = this.state;
    element.value = newValue;
    const validation: any = this._validate(newValue, "element");
    this.setState({ ...this.state, element, validation });
  }

  @autobind
  private _elementAsChanged(newValue: any): void {
    const { elementAs } = this.state;
    elementAs.value = newValue;
    const validation: any = this._validate(newValue, "elementAs");
    this.setState({ ...this.state, elementAs, validation });
  }

  @autobind
  private _elementThroughChanged(newValue: any): void {
    const { elementThrough } = this.state;
    elementThrough.value = newValue;
    const validation: any = this._validate(newValue, "elementThrough");
    this.setState({ ...this.state, elementThrough, validation });
  }

  @autobind
  private _elementThroughAsChanged(newValue: any): void {
    const { elementThroughAs } = this.state;
    elementThroughAs.value = newValue;
    const validation: any = this._validate(newValue, "elementThroughAs");
    this.setState({ ...this.state, elementThroughAs, validation });
  }

  @autobind
  private _onElementTypeChanged(option: IDropdownOption): void {
    const { element, elementAs, elementThrough, elementThroughAs, rangeType } = this.state;
    let { elementType } = this.state;
    elementType = option.key as string;
    this._setStateValue(element, elementAs, elementThrough, elementThroughAs, elementType, rangeType);
  }

  @autobind
  private _onRangeTypeChanged(option: IDropdownOption): void {
    const { element, elementAs, elementThrough, elementThroughAs, elementType } = this.state;
    let { rangeType } = this.state;
    rangeType = option.key as string;
    this._setStateValue(element, elementAs, elementThrough, elementThroughAs, elementType, rangeType);
  }
  @autobind
  private _validate(value: string, property: string): any {
    const { validation } = this.state;
    const regex: RegExp = new RegExp("[^\w\s.(){}-]");
    const isvalid: boolean = !regex.test(value);
    validation[property].isValid = isvalid;
    validation[property].Message = isvalid ? "" : `${property} is not Valid`;
    return validation;
  }
  private _getInitialValidation(): any {
    return {
      element: { Message: "", isValid: false },
      elementAs: { Message: "", isValid: false },
      elementThrough: { Message: "", isValid: false },
      elementThroughAs: { Message: "", isValid: false },
    };
  }

  private _setStateValue(element: IElement, elementAs: IElement,
    elementThrough: IElement, elementThroughAs: IElement, elementType: string, rangeType: string): void {
    if (elementType.toLowerCase().indexOf("renumber") >= 0 ||
      elementType.toLowerCase().indexOf("recreate") >= 0) {
      elementAs.disabled = false;
      elementThrough.disabled = elementThroughAs.disabled = true;
      if (rangeType === "And") {
        elementThrough.disabled = elementThroughAs.disabled = false;
      }
      if (rangeType === "Through") {
        elementThrough.disabled = false;
      }
    } else {
      elementAs.disabled = elementThrough.disabled = elementThroughAs.disabled = true;
      if (rangeType === "And" || rangeType === "Through") {
        elementThrough.disabled = false;
      }
    }
    elementThrough.error = elementThroughAs.error = "";
    if (!elementThrough.disabled && McsUtil.isString(elementThrough.value) && rangeType !== "And" && elementThrough[0] === "(") {
      elementThrough.error = "Only use short hand with 'and' handling.";
    }
    if (!elementThroughAs.disabled && McsUtil.isString(elementThroughAs.value) && rangeType !== "And" && elementThroughAs[0] === "(") {
      elementThroughAs.error = "Only use short hand with 'and' handling.";
    }
    this.setState({
      ...this.state,
      element,
      elementAs,
      elementThrough,
      elementThroughAs,
      elementType,
      rangeType,
    });
  }
}