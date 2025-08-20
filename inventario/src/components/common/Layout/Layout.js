import React from 'react';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      {/* Header, Sidebar, and Content will go here */}
      {children}
    </div>
  );
};

export default Layout;
