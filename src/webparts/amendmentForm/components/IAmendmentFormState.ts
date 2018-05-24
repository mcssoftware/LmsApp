import { Constants, IBills, IAmendments } from "mcs-lms-core";
import {
    IDropdownOption,
    IPersonaProps,
} from "office-ui-fabric-react";

export interface IAmendmentFormState {
    bill: IBills;
    amendment: IAmendments;
    error: string;
    loading: boolean;
    type: string;
    selectedSplitCount: number;
    selectedReading: string;
    selectedResurrectAmendment: number;
    offeredNumber: string;
    signedIn: boolean;
    hasToken?: boolean;
    resurrectAmendments: IDropdownOption[];
    openJccModal: boolean;
}

export interface IAmendmentFormData {
    DrafterToPersona?: IPersonaProps;
    UseLikeDuringCreate?: string;
}