import { SPUser } from "@microsoft/sp-page-context";

export interface IBillInformationProps {
  currentUser: SPUser;
  isLocalEnvironment: boolean;
}
