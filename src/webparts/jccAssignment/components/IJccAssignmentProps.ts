import { SPHttpClient } from "@microsoft/sp-http";

export interface IJccAssignmentProps {
  title: string;
  isLocalEnvironment: boolean;
  spHttpClient: SPHttpClient;
}
