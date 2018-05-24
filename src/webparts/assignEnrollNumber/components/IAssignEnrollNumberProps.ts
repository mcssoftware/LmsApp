import { SPHttpClient, HttpClient } from "@microsoft/sp-http";

export interface IAssignEnrollNumberProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
  httpClient: HttpClient;
}
