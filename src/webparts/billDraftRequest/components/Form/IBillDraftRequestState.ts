import { IBillDraftRequest } from "mcs-lms-core";

export interface IBillDraftRequestState {
    billDraftRequest: IBillDraftRequest;
    loading: boolean;
    error: string;
    formValidation: any;
    signedIn: boolean;
    hasToken?: boolean;
    canChangeBillType: boolean;
}
