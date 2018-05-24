import * as React from "react";
import styles from "./WebpartHeader.module.scss";
import { IWebpartHeaderProps } from "./IWebpartHeaderProps";

export default class WebpartHeader extends React.Component<IWebpartHeaderProps, {}> {
  public render(): React.ReactElement<IWebpartHeaderProps> {
    return (
      <div className={styles.webpartheader}>
        <div className={styles.row}>
          <span className={styles.headerText}>{this.props.webpartTitle}</span>
        </div>
      </div>
    );
  }
}