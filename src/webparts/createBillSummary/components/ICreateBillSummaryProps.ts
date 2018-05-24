import { SPHttpClient } from "@microsoft/sp-http";
export interface ICreateBillSummaryProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
}
