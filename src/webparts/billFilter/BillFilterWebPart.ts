import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-webpart-base";

import * as strings from "BillFilterWebPartStrings";
import BillFilter from "./components/BillFilter";
import { IBillFilterProps } from "./components/IBillFilterProps";
import { config } from "mcs-lms-core";
import ILinks from "../../controls/PropertyPaneLinks/ILinks";
import PropertyPaneLinks from "../../controls/PropertyPaneLinks/PropertyPaneLinks";
import { get, update } from "@microsoft/sp-lodash-subset";

export interface IBillFilterWebPartProps {
  links: ILinks[];
  showBillNumber: boolean;
}

export default class BillFilterWebPart extends BaseClientSideWebPart<IBillFilterWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const webUrl: string = Environment.type === EnvironmentType.Local ? "" : this.context.pageContext.web.absoluteUrl;

    const element: React.ReactElement<IBillFilterProps> = React.createElement(
      BillFilter,
      {
        isLocalEnvironment: (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local),
        showBillNumber: this.properties.showBillNumber || false,
        links: this.properties.links || [],
        webUrl,
      },
    );

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneToggle("showBillNumber", {
                  label: strings.ShowBillNumberLabel,
                }),
                new PropertyPaneLinks("links", {
                  label: strings.LinksLabel,
                  onPropertyChange: this._onListSelectionChanged.bind(this),
                  Items: this.properties.links,
                }),
              ],
            },
          ],
        },
      ],
    };
  }

  private _onListSelectionChanged(propertyPath: string, newValue: any): void {
    const oldValue: any = get(this.properties, propertyPath);
    // store new value in web part properties
    update(this.properties, propertyPath, (): any => newValue);
    // refresh web part
    this.render();
  }
}
