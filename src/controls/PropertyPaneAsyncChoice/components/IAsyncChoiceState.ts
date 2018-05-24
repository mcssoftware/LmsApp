export interface IAsyncChoiceState {
    loading: boolean;
    options: Array<{ label: string, value: string, isChecked: boolean }>;
    error: string;
}