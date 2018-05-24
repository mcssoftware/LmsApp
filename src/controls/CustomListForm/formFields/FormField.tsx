import * as React from "react";
import { AnimationClassNames } from "@uifabric/styling";
import * as stylesImport from "office-ui-fabric-react";
const styles: any = stylesImport;
import ardStyles from "./FormField.module.scss";
import { css, Label, DelayedRender, Icon } from "office-ui-fabric-react";
import { ControlMode } from "../ControlMode";

export interface IFormFieldProps {
  className?: string;
  controlMode: ControlMode;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  active?: boolean;
  value: any;
  errorMessage?: string;
  valueChanged(newValue: any): void;
}

// tslint:disable-next-line:variable-name
const FormField: React.SFC<IFormFieldProps> = (props) => {

  const {
    children,
    className,
    description,
    disabled,
    label,
    required,
    active,
    errorMessage,
  } = props;
  const formFieldClassName: string = css("ard-formField", ardStyles.formField, styles.root, className, {
    ["is-required " + styles.rootIsRequired]: required,
    ["is-disabled " + styles.rootIsDisabled]: disabled,
    ["is-active " + styles.rootIsActive]: active,
  });
  const isDescriptionAvailable: boolean = Boolean(props.description || props.errorMessage);

  return (
    <div className={css(formFieldClassName, "od-ClientFormFields-field")}>
      <div className={css("ard-FormField-wrapper", styles.wrapper)}>
        {label && <Label className={css(ardStyles.label, { ["is-required"]: required })} htmlFor={this._id}>{label}</Label>}
        <div className={css("ard-FormField-fieldGroup", ardStyles.controlContainerDisplay, active && styles.fieldGroupIsFocused, errorMessage && styles.invalid)}>
          {children}
        </div>
      </div>
      {isDescriptionAvailable &&
        <span>
          {description && <span className={css("ard-FormField-description", styles.description)}>{description}</span>}
          {errorMessage &&
            <div aria-live="assertive">
              <DelayedRender>
                <p className={css("ard-FormField-errorMessage", AnimationClassNames.slideDownIn20, styles.errorMessage)}>
                  {Icon({ iconName: "Error", className: styles.errorIcon })}
                  <span className={styles.errorText} data-automation-id="error-message">{errorMessage}</span>
                </p>
              </DelayedRender>
            </div>
          }
        </span>
      }
    </div>
  );
};

export default FormField;
