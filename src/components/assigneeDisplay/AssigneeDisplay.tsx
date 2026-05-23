import React from "react";
import styles from "./AssigneeDisplay.module.css";

interface Props {
  name: string;
  avatar?: string;
}

const AssigneeDisplay: React.FC<Props> = ({ name, avatar }) => {
  if (!name) return <span>-</span>;
  return (
    <span className={styles.wrapper}>
      {avatar ? <img className={styles.avatar} src={avatar} alt="" /> : <span className={styles.avatarPlaceholder} />}
      <span>{name}</span>
    </span>
  );
};

export default AssigneeDisplay;
