import { IElementsAffected, IBills } from "mcs-lms-core";

export interface IElementsDetailState {
    loading: boolean;
    error: string;
    bill: IBills;
    elementsAffected: IElementsAffected[];
    deleteDisabled: boolean;
    signedIn: boolean;
    hasToken?: boolean;
    filterText?: string;
}
