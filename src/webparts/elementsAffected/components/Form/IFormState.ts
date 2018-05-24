export interface IElement {
    value: string;
    disabled: boolean;
    error?: string;
}

export interface IFormState {
    element: IElement;
    elementAs: IElement;
    elementThrough: IElement;
    elementThroughAs: IElement;
    rangeType: string;
    isIntro: boolean;
    elementType: string;
    validation: any;
}
