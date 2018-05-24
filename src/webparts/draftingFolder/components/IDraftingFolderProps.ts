import { IListSelection } from "mcs-lms-core";
import { HttpClient } from "@microsoft/sp-http";

export interface IDraftingFolderProps {
  title: string;
  webUrl: string;
  lists: IListSelection[];
  httpClient: HttpClient;
  isLocalEnvironment: boolean;
  canCreateNewVersion: boolean;
}
