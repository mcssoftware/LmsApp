import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";
import FileEditField from "./FileEditField";

// tslint:disable-next-line:variable-name
const SPFileEdit: React.SFC<ISPFormFieldProps> = (props) => {
    return <FileEditField {...props} />;
};

export default SPFileEdit;
