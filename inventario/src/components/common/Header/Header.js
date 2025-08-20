import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <h1>Control de Inventario</h1>
      {/* ThemeToggle and Breadcrumb will go here */}
    </header>
  );
};

export default Header;
