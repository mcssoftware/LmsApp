import { SPHttpClient, HttpClient } from "@microsoft/sp-http";

export interface IAmendmentFormProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
  httpClient: HttpClient;
}
