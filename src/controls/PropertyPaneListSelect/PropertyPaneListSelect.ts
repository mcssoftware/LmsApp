import * as React from "react";
import * as ReactDom from "react-dom";
import { IPropertyPaneField, PropertyPaneFieldType } from "@microsoft/sp-webpart-base";
import { IPropertyPaneListSelectProps } from "./IPropertyPaneListSelectProps";
import { IPropertyPaneListSelectInternalProps } from "./IPropertyPaneListSelectInternalProps";
import { IListSelectProps } from "./components/IListSelectProps";
import ListSelect from "./components/ListSelect";
import { IListSelection } from "mcs-lms-core";

export class PropertyPaneListSelect implements IPropertyPaneField<IPropertyPaneListSelectProps> {
    private elem: HTMLElement;
    public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
    public targetProperty: string;
    // shouldFocus?: boolean;
    public properties: IPropertyPaneListSelectInternalProps;

    constructor(targetProperty: string, properties: IPropertyPaneListSelectProps) {
        this.targetProperty = targetProperty;
        this.properties = {
            key: properties.label,
            label: properties.label,
            loadOptions: properties.loadOptions,
            onPropertyChange: properties.onPropertyChange,
            selectedKey: properties.selectedKey,
            disabled: properties.disabled,
            onRender: this.onRender.bind(this),
        };
    }

    private onRender(elem: HTMLElement): void {
        if (!this.elem) {
            this.elem = elem;
        }
        let selectedKey: IListSelection[] = [];
        if (this.properties.selectedKey != null) {
            selectedKey = this.properties.selectedKey;
        }

        const element: React.ReactElement<IListSelectProps> = React.createElement(ListSelect, {
            label: this.properties.label,
            loadOptions: this.properties.loadOptions,
            onChanged: this.onChanged.bind(this),
            selectedKey,
            disabled: this.properties.disabled,
            // required to allow the component to be re-rendered by calling this.render() externally
            stateKey: new Date().toString(),
        });
        ReactDom.render(element, elem);
    }

    private onChanged(option: IListSelection[]): void {
        this.properties.onPropertyChange(this.targetProperty, option);
    }
}