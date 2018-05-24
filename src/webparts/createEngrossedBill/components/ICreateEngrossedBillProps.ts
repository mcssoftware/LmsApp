import { SPHttpClient, HttpClient } from "@microsoft/sp-http";

export interface ICreateEngrossedBillProps{
    title: string;
    isLocalEnvironment: boolean;
    spHttpClient: SPHttpClient;
    httpClient: HttpClient;
}
