import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";

// tslint:disable-next-line:variable-name
const SPFieldTextDisplay: React.SFC<ISPFormFieldProps> = (props) => {
    const value: string = (props.value) ? ((typeof props.value === "string") ? props.value : JSON.stringify(props.value)) : "";
    return <span className="ard-textfield-display">{value}</span>;
};

export default SPFieldTextDisplay;
