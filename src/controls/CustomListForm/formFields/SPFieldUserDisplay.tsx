import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";
import { Link } from "office-ui-fabric-react";

// tslint:disable-next-line:variable-name
const SPFieldUserDisplay: React.SFC<ISPFormFieldProps> = (props) => {
    if ((props.value) && (props.value.length > 0)) {
        const baseUrl: string = `${props.fieldSchema.ListFormUrl}?PageType=4&ListId=${props.fieldSchema.UserInfoListId}`;
        return <div>{props.value.map((val) => <div><Link href={`{baseUrl}&ID=${val.id}`}>{val.title}</Link></div>)}</div>;
    } else {
        return <div></div>;
    }
};

export default SPFieldUserDisplay;
