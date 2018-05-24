import ILinks from "./ILinks";

export interface IPropertyPaneLinksProps {
    label: string;
    onPropertyChange: (propertyPath: string, newValue: any) => void;
    Items: ILinks[];
}