import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "ElementsAffectedWebPartStrings";
import { IElementsDetailProps } from "./components/ElementsDetail/IElementsDetailProps";
import ElementsDetail from "./components/ElementsDetail/ElementsDetail";
import { config } from "mcs-lms-core";

export interface IElementsAffectedWebPartProps {
  description: string;
}

export default class ElementsAffectedWebPart extends BaseClientSideWebPart<IElementsAffectedWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<IElementsDetailProps> = React.createElement(
      ElementsDetail,
      {
        httpClient: this.context.httpClient,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        isLocalEnvironment: (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local),
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
