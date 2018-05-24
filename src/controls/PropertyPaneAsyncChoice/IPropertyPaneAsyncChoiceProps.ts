export interface IPropertyPaneAsyncChoiceProps {
    label: string;
    loadOptions: () => Promise<Array<{ label: string, value: string }>>;
    onPropertyChange: (propertyPath: string, newValue: string[]) => void;
    selectedKey: string[];
    disabled?: boolean;
}