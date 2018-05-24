import * as pnp from "sp-pnp-js";
import { SiteUserProps } from "sp-pnp-js";
import { IPersonaProps } from "office-ui-fabric-react";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { McsUtil, config } from "mcs-lms-core";

export class PeopleService {

    public loadUserById(id: number): Promise<SiteUserProps> {
        return new Promise<SiteUserProps>((resolve, reject) => {
            if (McsUtil.isDefined(id)) {
                const web: pnp.Web = new pnp.Web(config.getLmsUrl());
                web.siteUsers.getById(id).get()
                    .then((result: SiteUserProps) => {
                        resolve(result);
                    });
            } else {
                resolve(null);
            }
        });
    }

    public loadUserByName(name: string): Promise<SiteUserProps> {
        return new Promise<SiteUserProps>((resolve, reject) => {
            if (McsUtil.isString(name)) {
                const web: pnp.Web = new pnp.Web(config.getLmsUrl());
                web.siteUsers.filter(`Title eq '${name}'`).top(1).get()
                    .then((value) => {
                        resolve(value.length > 0 ? value[0] : null);
                    }, (err) => { reject(err); });
            } else {
                resolve(null);
            }
        });
    }

    public loadCurrentUser(): Promise<SiteUserProps> {
        return new Promise<SiteUserProps>((resolve, reject) => {
            const web: pnp.Web = new pnp.Web(config.getLmsUrl());
            web.currentUser.get()
                .then((value) => {
                    resolve(value);
                }, (err) => { reject(err); });
        });
    }

    public loadCurrentUserProfile(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const sp: any = pnp.sp.configure({}, config.getSiteUrl());
            sp.profiles.myProperties.get()
                .then((properties) => {
                    resolve(properties);
                });
        });
    }

    public getPersonaPropForIds(userIds: number[]): Promise<IPersonaProps[]> {
        return new Promise<IPersonaProps[]>((resolve, reject) => {
            this.loadUserByIds(userIds)
                .then((peopleValue) => {
                    const tempPersona: IPersonaProps[] = peopleValue.map((value): IPersonaProps => {
                        return this.getPersonaPropForUser(value);
                    });
                    resolve(tempPersona);
                }, (err) => { reject(err); });
        });
    }

    public getPersonaPropForUser(value: SiteUserProps): IPersonaProps {
        const persona: IPersonaProps = {};
        if (McsUtil.isDefined(value)) {
            persona.primaryText = value.Title;
            persona.tertiaryText = value.LoginName;
            persona.imageUrl = `/_layouts/15/userphoto.aspx?size=S&accountname=${value.Email}`;
            persona.imageShouldFadeIn = true;
            persona.secondaryText = value.Title;
        }
        return persona;
    }

    public loadUserByIds(id: number[]): Promise<SiteUserProps[]> {
        return new Promise<SiteUserProps[]>((resolve, reject) => {
            id = McsUtil.isArray(id) ? id : [];
            const filteredIds: number[] = id.filter((f) => f > 0);
            if (filteredIds.length < 1) {
                resolve([]);
            } else {
                const filter: string = filteredIds.map((value) => {
                    return "Id eq " + value;
                }).join(" or ");
                const web: pnp.Web = new pnp.Web(config.getLmsUrl());
                web.siteUsers.filter(filter).get()
                    .then((result: SiteUserProps[]) => {
                        resolve(result);
                    });
            }
        });
    }

    public ensureUser(loginname: string): Promise<SiteUserProps> {
        return new Promise<SiteUserProps>((resolve, reject) => {
            const web: pnp.Web = new pnp.Web(config.getLmsUrl());
            web.ensureUser(loginname)
                .then((result) => {
                    resolve(result.data);
                }, (err) => { reject(err); });
        });
    }

    public searchPeople(spHttpClient: SPHttpClient, principalType: number, searchTerm: string): Promise<IPersonaProps[]> {
        return new Promise<IPersonaProps[]>((resolve, reject) => {
            const userRequestUrl: string = `${config.getSiteUrl()}/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser`;
            const data: any = {
                queryParams: {
                    AllowEmailAddresses: true,
                    AllowMultipleEntities: false,
                    AllUrlZones: false,
                    MaximumEntitySuggestions: 5,
                    PrincipalSource: 15,
                    // principalType controls the type of entities that are returned in the results.
                    // choices are All - 15, Distribution List - 2 , Security Groups - 4, SharePoint Groups - 8, User - 1.
                    // these values can be combined (example: 13 is security + SP groups + users)
                    PrincipalType: principalType,
                    QueryString: searchTerm,
                },
            };
            spHttpClient.post(userRequestUrl,
                SPHttpClient.configurations.v1,
                {
                    headers: {
                        "Accept": "application/json",
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(data),
                })
                .then((response: SPHttpClientResponse) => {
                    return response.json();
                })
                .then((response: any): void => {
                    const relevantResults: any = JSON.parse(response.value);
                    const resultCount: number = relevantResults.length;
                    const peopleProp: IPersonaProps[] = [];
                    if (resultCount > 0) {
                        for (let index: number = 0; index < resultCount; index++) {
                            const p: any = relevantResults[index];
                            const account: string = p.Key.substr(p.Key.lastIndexOf("|") + 1);
                            const persona: IPersonaProps = {};
                            persona.primaryText = p.DisplayText;
                            persona.tertiaryText = account;
                            persona.imageUrl = `/_layouts/15/userphoto.aspx?size=S&accountname=${account}`;
                            persona.imageShouldFadeIn = true;
                            persona.secondaryText = p.EntityData.Title;
                            peopleProp.push(persona);
                        }
                    }
                    resolve(peopleProp);
                }, (error: any): void => {
                    reject([]);
                });
        });
    }
}
