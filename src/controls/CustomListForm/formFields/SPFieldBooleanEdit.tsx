import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";
import { Toggle } from "office-ui-fabric-react";
import { FormFieldStrings  } from "./FormFieldStrings";

// tslint:disable-next-line:variable-name
const SPFieldBooleanEdit: React.SFC<ISPFormFieldProps> = (props) => {
    return <Toggle
                className="ard-booleanFormField"
                checked={props.value === "1" || props.value === "true" || props.value === "Yes"}
                onAriaLabel={FormFieldStrings.ToggleOnAriaLabel}
                offAriaLabel={FormFieldStrings.ToggleOffAriaLabel}
                onText={FormFieldStrings.ToggleOnText}
                offText={FormFieldStrings.ToggleOffText}
                onChanged={ (checked: boolean) => props.valueChanged(checked.toString())}
            />;
};

export default SPFieldBooleanEdit;
