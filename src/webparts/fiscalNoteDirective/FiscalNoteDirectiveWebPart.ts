import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "FiscalNoteDirectiveWebPartStrings";
import FiscalNoteDirective from "./components/FiscalNoteDirective";
import { IFiscalNoteDirectiveProps } from "./components/IFiscalNoteDirectiveProps";
import { config } from "mcs-lms-core";

export interface IFiscalNoteDirectiveWebPartProps {
  description: string;
}

export default class FiscalNoteDirectiveWebPart extends BaseClientSideWebPart<IFiscalNoteDirectiveWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<IFiscalNoteDirectiveProps> = React.createElement(
      FiscalNoteDirective,
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
