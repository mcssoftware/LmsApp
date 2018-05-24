import { SPHttpClient, HttpClient } from "@microsoft/sp-http";

export interface ICreateNumberedBillProps {
    title: string;
    isLocalEnvironment: boolean;
    spHttpClient: SPHttpClient;
    httpClient: HttpClient;
}
