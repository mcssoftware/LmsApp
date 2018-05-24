import { SPHttpClient } from "@microsoft/sp-http";

export interface ISponsorApprovalProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
}
