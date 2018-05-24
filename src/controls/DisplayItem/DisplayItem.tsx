import * as React from "react";
import styles from "./DisplayItem.module.scss";
import { IDisplayItemProps } from "./IDisplayItemProps";

export default class DisplayItem extends React.Component<IDisplayItemProps, {}> {
  public render(): React.ReactElement<IDisplayItemProps> {
    return (
      <div className={styles.displayItem + (this.props.className ? " " + this.props.className : "")}>
        <div className={styles.row}>
          <div className={styles.column + " " + styles.propertyName}>{this.props.labelText}&nbsp;:</div>
          {typeof this.props.children === "undefined" && <div className={styles.column + " " + styles.propertyValue}>{this.props.value}</div>}
          {typeof this.props.children !== "undefined" && <div className={styles.column + " " + styles.propertyValue}>{this.props.children}</div>}
        </div>
      </div>
    );
  }
}