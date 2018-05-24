import { HttpClient } from "@microsoft/sp-http";

export interface IElementsDetailProps {
  httpClient: HttpClient;
  isLocalEnvironment: boolean;
  webAbsoluteUrl: string;
}
