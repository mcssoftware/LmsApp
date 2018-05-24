import * as React from "react";
import { ISPFormFieldProps } from "./SPFormField";
import { Link } from "office-ui-fabric-react";

// tslint:disable-next-line:variable-name
const SPFieldLookupDisplay: React.SFC<ISPFormFieldProps> = (props) => {
    if ((props.value) && (props.value.length > 0)) {
        const baseUrl: string = `${props.fieldSchema.BaseDisplayFormUrl}&ListId={${props.fieldSchema.LookupListId}}`;
        return <div>
            {props.value.map((val) => <div><Link href={`{baseUrl}&ID=${val.lookupId}`}>{val.lookupValue}</Link></div>)}
        </div>;
    } else {
        return <div></div>;
    }
};

export default SPFieldLookupDisplay;
