import { HttpClient, SPHttpClient } from "@microsoft/sp-http";

export interface IBillDraftRequestProps {
  isLocalEnvironment: boolean;
  isInEditMode: boolean;
  webUrl: string;
  httpClient: HttpClient;
  spHttpClient: SPHttpClient;
}
