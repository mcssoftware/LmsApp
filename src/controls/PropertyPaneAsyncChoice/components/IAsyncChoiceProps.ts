export interface IAsyncChoiceProps {
    label: string;
    loadOptions: () => Promise<Array<{ label: string, value: string }>>;
    onChanged: (option: Array<{ label: string, value: string }>) => void;
    selectedKey: string[];
    disabled: boolean;
    stateKey: string;
}