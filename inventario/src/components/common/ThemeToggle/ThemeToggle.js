import React, { useContext } from 'react';
import { Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { ThemeContext } from '../../../context/ThemeContext'; // Adjust path if necessary
// import { MoonOutlined, SunOutlined } from '@ant-design/icons'; // Optional icons
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  if (!toggleTheme) {
    // Fallback or error if toggleTheme is not provided by context
    // This might happen if ThemeToggle is rendered outside ThemeProvider
    console.warn('ThemeToggle: toggleTheme function is not available from ThemeContext.');
    return null; 
  }

  return (
    <Switch
      className={styles.customSwitch}
      checked={theme === 'dark'}
      onChange={toggleTheme}
      checkedChildren={<MoonOutlined />}
      unCheckedChildren={<SunOutlined />}
    />
  );
};

export default ThemeToggle;
