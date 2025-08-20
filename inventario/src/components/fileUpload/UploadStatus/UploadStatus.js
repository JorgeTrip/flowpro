import React from 'react';
import { Alert } from 'antd';
import styles from './UploadStatus.module.css';

const UploadStatus = ({ status, message, count }) => {
  if (!status) return null;

  let alertType = 'info';
  if (status === 'success') alertType = 'success';
  if (status === 'error') alertType = 'error';
  if (status === 'loading') alertType = 'info';

  return (
    <div className={styles.uploadStatus}>
      <Alert 
        message={message} 
        description={count ? `Registros procesados: ${count}` : null}
        type={alertType} 
        showIcon 
      />
    </div>
  );
};

export default UploadStatus;
