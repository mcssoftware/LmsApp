import { Constants, ILegislator, ICommittee } from "mcs-lms-core";

export interface ISponsorSelectorProps {
    isLocalEnvironment: boolean;
    allowOther: boolean;
    label: string;
    multiselect?: boolean;
    selectedType?: Constants.SponsorType;
    selectedValue?: string;
    isRequired?: boolean;
    disabled?: boolean;
    errorMessage?: string;
    onchange?: (type: Constants.SponsorType, selected: string, items?: any[]) => void;
    legislatorFilter?: (value: ILegislator, index?: number, array?: ILegislator[]) => boolean;
    committeeFilter?: (value: ICommittee, index?: number, array?: ICommittee[]) => boolean;
}