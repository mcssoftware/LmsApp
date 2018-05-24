import React = require("react");
import * as ReactDom from "react-dom";
import { IPropertyPaneLinksProps } from "./IPropertyPaneLinksProps";
import { IPropertyPaneField, PropertyPaneFieldType } from "@microsoft/sp-webpart-base";
import { IPropertyPaneLinkInternalProps } from "./IPropertyPaneLinkInternalProps";
import ILinks from "./ILinks";
import Links from "./components/Links";
import { ILinksProps } from "./components/ILinksProps";

export default class PropertyPaneLinks implements IPropertyPaneField<IPropertyPaneLinksProps>{
    private elem: HTMLElement;
    public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
    public targetProperty: string;
    public properties: IPropertyPaneLinkInternalProps;

    constructor(targetProperty: string, properties: IPropertyPaneLinksProps) {
        this.targetProperty = targetProperty;
        this.properties = {
            key: properties.label,
            label: properties.label,
            onPropertyChange: properties.onPropertyChange,
            Items: properties.Items,
            onRender: this.onRender.bind(this),
        };
    }

    private onRender(elem: HTMLElement): void {
        if (!this.elem) {
            this.elem = elem;
        }
        let items: ILinks[] = [];
        if (this.properties.Items != null) {
            items = this.properties.Items;
        }

        const element: React.ReactElement<ILinksProps> = React.createElement(Links, {
            label: this.properties.label,
            onChanged: this._onChanged.bind(this),
            Items: items,
            // required to allow the component to be re-rendered by calling this.render() externally
            stateKey: new Date().toString(),
        });
        ReactDom.render(element, elem);
    }

    private _onChanged(option: ILinks[]): void {
        this.properties.onPropertyChange(this.targetProperty, option);
    }
}