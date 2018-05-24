import { SPHttpClient, ISPHttpClientOptions, SPHttpClientResponse } from "@microsoft/sp-http";
import { McsUtil, config } from "mcs-lms-core";

// tslint:disable:object-literal-key-quotes

export default class EmailService {
    public static sendTaskEmail(spHttpClient: SPHttpClient): void {
        const spOpts: ISPHttpClientOptions = {
            body: JSON.stringify({
                "properties": {
                    ___metadata: {
                        "type": "SP.Utilities.EmailProperties",
                    },
                    From: "from",
                    To: {
                        "results": ["sameer@mcssoftwaresolutions.com"],
                    },
                    Body: "",
                    Subject: "",
                },
            }),
        };

        spHttpClient.post(McsUtil.combinePaths(config.getLmsUrl(), "/_api/SP.Utilities.Utility.SendEmail"),
            SPHttpClient.configurations.v1, spOpts)
            // tslint:disable-next-line:no-empty
            .then((response: SPHttpClientResponse) => {
            });
    }
}