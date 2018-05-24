import { HttpClient } from "@microsoft/sp-http";
import { IElementsAffected, IBills } from "mcs-lms-core";

export interface IFormProps {
    httpClient: HttpClient;
    isLocalEnvironment: boolean;
    webAbsoluteUrl: string;
    bill: IBills;
    onElementsAddClicked: (elements: IElementsAffected[]) => Promise<void>;
}
