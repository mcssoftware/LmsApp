import { SPHttpClient } from "@microsoft/sp-http";

export interface IAssignChapterNumberProps{
    title: string;
    isLocalEnvironment: boolean;
    spHttpClient: SPHttpClient;
}
