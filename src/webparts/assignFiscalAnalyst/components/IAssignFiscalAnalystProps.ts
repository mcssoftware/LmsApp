import { SPHttpClient } from "@microsoft/sp-http";

export interface IAssignFiscalAnalystProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
}
