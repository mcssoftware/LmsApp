import { SPHttpClient, HttpClient } from "@microsoft/sp-http";

export interface ICreateSessionLawProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
  httpClient: HttpClient;
}
