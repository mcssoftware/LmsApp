import { IChoiceGroupOption } from "office-ui-fabric-react";

export interface IInfoReceivedSectionProps {
    isrequired?: boolean;
    errorMessage?: string;
    selectedValue: string;
    label: string;
    options: IChoiceGroupOption[];
    onChanged?: (value: string) => void;
}
