import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType, DisplayMode } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "BillDraftRequestWebPartStrings";
import BillDraftRequest from "./components/Form/BillDraftRequest";
import { IBillDraftRequestProps } from "./components/Form/IBillDraftRequestProps";
import { config } from "mcs-lms-core";

export interface IBillDraftRequestWebPartProps {
  description: string;
}

export default class BillDraftRequestWebPart extends BaseClientSideWebPart<IBillDraftRequestWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<IBillDraftRequestProps> = React.createElement(
      BillDraftRequest,
      {
        isLocalEnvironment: (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local),
        isInEditMode: (Environment.type === EnvironmentType.SharePoint) && (this.displayMode === DisplayMode.Edit),
        webUrl: this.context && this.context.pageContext ? this.context.pageContext.web.absoluteUrl : "",
        spHttpClient: this.context.spHttpClient,
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
