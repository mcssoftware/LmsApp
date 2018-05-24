import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";
import NumberFormField from "./NumberFormField";

import { FormFieldStrings  } from "./FormFieldStrings";

// tslint:disable-next-line:variable-name
const SPFieldNumberEdit: React.SFC<ISPFormFieldProps> = (props) => {
    return <NumberFormField
        className="ard-numberFormField"
        value={props.value}
        valueChanged={props.valueChanged}
        placeholder={FormFieldStrings.NumberFormFieldPlaceholder}
        underlined
    />;
};

export default SPFieldNumberEdit;
