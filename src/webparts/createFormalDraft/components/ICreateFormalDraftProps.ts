import { SPHttpClient } from "@microsoft/sp-http";

export interface ICreateFormalDraftProps {
    title: string;
    isLocalEnvironment: boolean;
    spHttpClient: SPHttpClient;
}
