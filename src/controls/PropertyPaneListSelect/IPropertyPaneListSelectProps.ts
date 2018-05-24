import { IList, IListSelection } from "mcs-lms-core";

export interface IPropertyPaneListSelectProps {
    label: string;
    loadOptions: () => Promise<IList[]>;
    onPropertyChange: (propertyPath: string, newValue: any) => void;
    selectedKey: IListSelection[];
    disabled?: boolean;
}