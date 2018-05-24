import * as React from "react";
import * as ReactDom from "react-dom";
import {
    IPropertyPaneField,
    PropertyPaneFieldType,
} from "@microsoft/sp-webpart-base";
import { IAsyncChoiceProps } from "./components/IAsyncChoiceProps";
import AsyncChoice from "./components/AsyncChoice";
import { IPropertyPaneAsyncChoiceProps } from "./IPropertyPaneAsyncChoiceProps";
import { IPropertyPaneAsyncChoiceInternalProps } from "./IPropertyPaneAsyncChoiceInternalProps";
import { autobind } from "office-ui-fabric-react";

export class PropertyPaneAsyncChoice implements IPropertyPaneField<IPropertyPaneAsyncChoiceProps> {
    private elem: HTMLElement;
    public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
    public targetProperty: string;
    public properties: IPropertyPaneAsyncChoiceInternalProps;

    constructor(targetProperty: string, properties: IPropertyPaneAsyncChoiceProps) {
        this.targetProperty = targetProperty;
        this.properties = {
            key: properties.label,
            label: properties.label,
            loadOptions: properties.loadOptions,
            onPropertyChange: properties.onPropertyChange,
            disabled: properties.disabled,
            selectedKey: properties.selectedKey || [],
            onRender: this.onRender,
        };
    }

    public render(): void {
        if (!this.elem) {
            return;
        }
        this.onRender(this.elem);
    }

    @autobind
    private onRender(elem: HTMLElement): void {
        if (!this.elem) {
            this.elem = elem;
        }

        const element: React.ReactElement<IAsyncChoiceProps> = React.createElement(AsyncChoice, {
            label: this.properties.label,
            loadOptions: this.properties.loadOptions,
            onChanged: this._onChanged,
            disabled: this.properties.disabled,
            selectedKey: this.properties.selectedKey,
            // required to allow the component to be re-rendered by calling this.render() externally
            stateKey: new Date().toString(),
        });
        ReactDom.render(element, elem);
    }

    @autobind
    private _onChanged(option: Array<{ label: string, value: string }>): void {
        this.properties.onPropertyChange(this.targetProperty, option.map((e) => e.value));
    }
}