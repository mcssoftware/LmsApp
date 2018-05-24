import { ILmsTaskProps } from "../../../lmsTask/components/ILmsTaskProps";
import { HttpClient } from "@microsoft/sp-http";

// tslint:disable-next-line:no-empty-interface
export interface IBillTrackingProps extends ILmsTaskProps {
    httpClient: HttpClient;
}
