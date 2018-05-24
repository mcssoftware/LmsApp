import { SiteUserProps } from "sp-pnp-js";
import { SPHttpClient } from "@microsoft/sp-http";
import { IPersonaProps } from "office-ui-fabric-react";

export interface ILmsPeoplePickerProps {
    label: string;
    spHttpClient: SPHttpClient;
    principalTypeUser: boolean;
    principalTypeSharePointGroup: boolean;
    principalTypeSecurityGroup: boolean;
    principalTypeDistributionList: boolean;
    selectedUser?: IPersonaProps[];
    isLocalEnvironment: boolean;
    disabled?: boolean;
    onchange?: (users: SiteUserProps[], items: IPersonaProps[]) => void;
}
