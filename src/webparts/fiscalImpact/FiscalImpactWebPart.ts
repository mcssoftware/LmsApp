import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "FiscalImpactWebPartStrings";
import FiscalImpact from "./components/FiscalImpact";
import { IFiscalImpactProps } from "./components/IFiscalImpactProps";
import { config } from "mcs-lms-core";

export interface IFiscalImpactWebPartProps {
  description: string;
}

export default class FiscalImpactWebPart extends BaseClientSideWebPart<IFiscalImpactWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<IFiscalImpactProps> = React.createElement(
      FiscalImpact,
      {
        httpClient: this.context.httpClient,
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
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
