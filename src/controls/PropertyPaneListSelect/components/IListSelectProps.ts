import { IList, IListSelection } from "mcs-lms-core";

export interface IListSelectProps {
    label: string;
    loadOptions: () => Promise<IList[]>;
    onChanged: (option: IListSelection[]) => void;
    selectedKey: IListSelection[];
    disabled: boolean;
    stateKey: string;
}